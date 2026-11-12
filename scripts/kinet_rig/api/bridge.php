<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: *");
header("Content-Type: application/json");

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$host = '127.0.0.1';
$port = 4004;
$targetVersion = '1.1.2';

$rootDir = realpath(__DIR__ . '/..');
$configFile = $rootDir . DIRECTORY_SEPARATOR . 'kinet.config.json';
if (file_exists($configFile)) {
    $cfg = @json_decode(@file_get_contents($configFile), true);
    if (is_array($cfg)) {
        if (!empty($cfg['host']) && preg_match('/^[a-zA-Z0-9.-]+$/', $cfg['host'])) {
            $host = $cfg['host'];
        }
        if (!empty($cfg['port']) && (int)$cfg['port'] >= 1024 && (int)$cfg['port'] <= 65535) {
            $port = (int)$cfg['port'];
        }
    }
}

if (isset($_GET['host']) && preg_match('/^[a-zA-Z0-9.-]+$/', $_GET['host'])) {
    $host = $_GET['host'];
}
if (isset($_GET['port']) && (int)$_GET['port'] >= 1024 && (int)$_GET['port'] <= 65535) {
    $port = (int)$_GET['port'];
}
$prevPort = (isset($_GET['prevPort']) && (int)$_GET['prevPort'] >= 1024 && (int)$_GET['prevPort'] <= 65535) ? (int)$_GET['prevPort'] : 0;
$probeHost = ($host === '0.0.0.0') ? '127.0.0.1' : $host;

function is_windows(): bool {
    return strtoupper(substr(PHP_OS, 0, 3)) === 'WIN';
}

function ps_quote(string $val): string {
    return "'" . str_replace("'", "''", $val) . "'";
}

function find_powershell_exe(): string {
    $sysPs = 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe';
    return file_exists($sysPs) ? $sysPs : 'powershell.exe';
}

function run_powershell(string $psScript): bool {
    $psExe = find_powershell_exe();
    $args = [$psExe, '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', $psScript];
    $nullIn = is_windows() ? 'NUL' : '/dev/null';
    $descriptors = [
        0 => ['file', $nullIn, 'r'],
        1 => ['file', $nullIn, 'w'],
        2 => ['file', $nullIn, 'w'],
    ];
    if (PHP_VERSION_ID >= 70400 && function_exists('proc_open')) {
        $proc = @proc_open($args, $descriptors, $pipes, null, null, ['bypass_shell' => true]);
        if (is_resource($proc)) {
            proc_close($proc);
            return true;
        }
    }
    $utf16 = false;
    if (function_exists('mb_convert_encoding')) {
        $utf16 = mb_convert_encoding($psScript, 'UTF-16LE', 'UTF-8');
    } elseif (function_exists('iconv')) {
        $utf16 = iconv('UTF-8', 'UTF-16LE', $psScript);
    }
    if ($utf16 !== false) {
        @exec(escapeshellarg($psExe) . ' -NoProfile -NonInteractive -ExecutionPolicy Bypass -EncodedCommand ' . base64_encode($utf16));
        return true;
    }
    return false;
}

function find_node_exe(): ?string {
    if (is_windows()) {
        $candidates = [
            'C:\\Program Files\\nodejs\\node.exe',
            'C:\\Program Files (x86)\\nodejs\\node.exe',
        ];
        $localApp = getenv('LOCALAPPDATA');
        if ($localApp) $candidates[] = $localApp . '\\Programs\\nodejs\\node.exe';
        $nvmSym = getenv('NVM_SYMLINK');
        if ($nvmSym) $candidates[] = $nvmSym . '\\node.exe';
        $progData = getenv('ProgramData');
        if ($progData) $candidates[] = $progData . '\\chocolatey\\bin\\node.exe';
        $userProfile = getenv('USERPROFILE');
        if ($userProfile) {
            $candidates[] = $userProfile . '\\scoop\\shims\\node.exe';
            $candidates[] = $userProfile . '\\.volta\\bin\\node.exe';
        }
        $laragonBin = @realpath(dirname(PHP_BINARY) . '\\..\\..');
        if ($laragonBin && is_dir($laragonBin . '\\nodejs')) {
            foreach ((@glob($laragonBin . '\\nodejs\\node*\\node.exe') ?: []) as $g) {
                $candidates[] = $g;
            }
        }
        foreach (['C:\\laragon\\bin\\nodejs\\node*\\node.exe', 'D:\\laragon\\bin\\nodejs\\node*\\node.exe'] as $pattern) {
            foreach ((@glob($pattern) ?: []) as $g) {
                $candidates[] = $g;
            }
        }
        foreach ($candidates as $path) {
            if ($path && @is_file($path)) {
                return $path;
            }
        }
        $whereOut = [];
        @exec('where node 2>NUL', $whereOut);
        foreach ($whereOut as $line) {
            $line = trim($line);
            if ($line !== '' && @is_file($line)) {
                return $line;
            }
        }
        return null;
    }

    foreach (['/usr/local/bin/node', '/opt/homebrew/bin/node', '/usr/bin/node'] as $path) {
        if (@is_file($path) && @is_executable($path)) {
            return $path;
        }
    }
    $which = trim((string)@shell_exec('command -v node 2>/dev/null'));
    return ($which !== '' && @is_executable($which)) ? $which : null;
}

function is_bridge_up(string $host, int $port): bool {
    $fp = @fsockopen($host, $port, $errno, $errstr, 0.25);
    if ($fp) {
        fclose($fp);
        return true;
    }
    return false;
}

function get_bridge_version(string $host, int $port): ?string {
    $ctx = stream_context_create(['http' => ['timeout' => 0.8]]);
    $raw = @file_get_contents("http://$host:$port/api/health", false, $ctx);
    if ($raw) {
        $json = @json_decode($raw, true);
        return $json['version'] ?? null;
    }
    return null;
}

function kill_bridge(string $host, int $port): void {
    if (is_windows()) {
        $psCmd = 'Get-NetTCPConnection -LocalPort ' . $port . ' -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | Where-Object { $_ -gt 4 } | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }';
        run_powershell($psCmd);
    } else {
        @exec("(fuser -k $port/tcp || lsof -ti tcp:$port | xargs kill -9) >/dev/null 2>&1");
    }
    for ($i = 0; $i < 15; $i++) {
        if (!is_bridge_up($host, $port)) break;
        usleep(100000);
    }
}

$forceRestart = isset($_GET['restart']) || isset($_GET['reload']);
$currentVersion = is_bridge_up($probeHost, $port) ? get_bridge_version($probeHost, $port) : null;

$versionMismatch = $currentVersion !== null && $currentVersion !== $targetVersion;
if ($forceRestart || $versionMismatch) {
    if ($prevPort > 0 && $prevPort !== $port) {
        kill_bridge($probeHost, $prevPort);
    }
    kill_bridge($probeHost, $port);
}

$spawnError = null;
$nodeExe = null;

if (!is_bridge_up($probeHost, $port)) {
    $nodeExe = find_node_exe();
    if ($nodeExe === null) {
        $spawnError = 'Node.js executable not found by PHP. Start manually with "npm run studio" or install Node.js.';
    } else {
        if (is_windows()) {
            $psCmd = 'Start-Process -FilePath ' . ps_quote($nodeExe)
                . ' -ArgumentList @(' . ps_quote('scripts/server.mjs') . ',' . ps_quote((string)$port) . ',' . ps_quote('--host') . ',' . ps_quote($host) . ')'
                . ' -WorkingDirectory ' . ps_quote($rootDir)
                . ' -WindowStyle Hidden';
            run_powershell($psCmd);
        } else {
            @exec('cd ' . escapeshellarg($rootDir) . ' && nohup ' . escapeshellarg($nodeExe) . ' scripts/server.mjs ' . $port . ' --host ' . escapeshellarg($host) . ' >/dev/null 2>&1 &');
        }

        for ($i = 0; $i < 35; $i++) {
            usleep(200000); // 200ms (up to 7s)
            if (is_bridge_up($probeHost, $port)) {
                break;
            }
        }
    }
}

$ready = is_bridge_up($probeHost, $port);
$version = $ready ? get_bridge_version($probeHost, $port) : null;

if (!$ready && $spawnError === null) {
    $spawnError = "Node bridge did not respond on $probeHost:$port within 7s. Run \"npm run studio\" to inspect logs.";
}

echo json_encode([
    'ok' => $ready,
    'status' => $ready ? 'ready' : ($spawnError && strpos($spawnError, 'not found') !== false ? 'node_missing' : 'failed'),
    'error' => $ready ? null : $spawnError,
    'host' => $host,
    'port' => $port,
    'version' => $version,
    'bridge' => "http://$probeHost:$port"
]);
