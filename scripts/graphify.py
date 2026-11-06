"""
ContextRig Graphify Tool - Codebase Dependency & Knowledge Graph Generator
Generates an interactive visual graph (graph.html), JSON dataset, and architecture report in 'graphify-out/'.
"""
import sys
import os
import re
import json
import shutil
import subprocess
from datetime import datetime
from pathlib import Path

IGNORE_DIRS = {
    ".git", "node_modules", "vendor", "graphify-out", "dist",
    "build", ".next", ".nuxt", "__pycache__", ".venv", "venv",
    ".idea", ".vscode", "coverage", ".turbo"
}

CODE_EXTS = {
    ".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs",
    ".py", ".php", ".vue", ".html", ".css", ".json",
    ".md", ".go", ".rs", ".java", ".rb", ".c", ".cpp"
}

def detect_imports(file_path, content, all_rel_files):
    """Detect simple file import dependencies based on syntax regex."""
    deps = []
    ext = os.path.splitext(file_path)[1].lower()
    
    patterns = []
    if ext in {".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs", ".vue"}:
        patterns = [
            r"""(?:import|from)\s+['"]([^'"]+)['"]""",
            r"""require\s*\(\s*['"]([^'"]+)['"]\s*\)"""
        ]
    elif ext == ".py":
        patterns = [
            r"""(?:from|import)\s+([a-zA-Z0-9_\.]+)"""
        ]
    elif ext == ".php":
        patterns = [
            r"""(?:require|require_once|include|include_once)\s*\(?['"]([^'"]+)['"]\)?""",
            r"""use\s+([a-zA-Z0-9_\\]+)"""
        ]

    for pat in patterns:
        for match in re.finditer(pat, content):
            raw_target = match.group(1).replace("\\", "/")
            # Match against local project files
            for other in all_rel_files:
                if other != file_path and (raw_target in other or os.path.basename(other).startswith(raw_target.split("/")[-1])):
                    deps.append(other)
                    break
    return list(set(deps))

def generate_vis_html(graph_data, project_name):
    """Generates a standalone, dark-themed interactive HTML visualization using vis-network."""
    nodes_json = json.dumps(graph_data["nodes"])
    edges_json = json.dumps(graph_data["edges"])
    
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Graphify - {project_name}</title>
<script src="https://unpkg.com/vis-network@9.1.6/standalone/umd/vis-network.min.js"></script>
<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{
    background: #0f0f1a;
    color: #e0e0e0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    display: flex;
    height: 100vh;
    overflow: hidden;
  }}
  #graph-container {{
    flex: 1;
    position: relative;
    background: radial-gradient(circle at center, #16162a 0%, #0a0a14 100%);
  }}
  #graph {{
    width: 100%;
    height: 100%;
  }}
  #sidebar {{
    width: 320px;
    background: #151528;
    border-left: 1px solid #282846;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    z-index: 10;
    box-shadow: -4px 0 20px rgba(0,0,0,0.5);
  }}
  .sidebar-header {{
    padding: 16px;
    background: #1a1a32;
    border-bottom: 1px solid #282846;
  }}
  .sidebar-header h2 {{
    font-size: 16px;
    font-weight: 700;
    color: #4da3ff;
    display: flex;
    align-items: center;
    gap: 8px;
  }}
  .sidebar-header p {{
    font-size: 11px;
    color: #8b8ba7;
    margin-top: 4px;
  }}
  #search-box {{
    padding: 12px 16px;
    border-bottom: 1px solid #282846;
  }}
  #search {{
    width: 100%;
    background: #0d0d18;
    border: 1px solid #36365a;
    color: #e0e0e0;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 12px;
    outline: none;
    transition: border-color 0.2s;
  }}
  #search:focus {{
    border-color: #4da3ff;
  }}
  #info-panel {{
    flex: 1;
    padding: 16px;
    overflow-y: auto;
  }}
  .info-title {{
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #79799d;
    margin-bottom: 8px;
  }}
  .info-card {{
    background: #0d0d1a;
    border: 1px solid #23233c;
    border-radius: 6px;
    padding: 12px;
    margin-bottom: 16px;
  }}
  .info-card b {{
    color: #fff;
    word-break: break-all;
  }}
  .badge {{
    display: inline-block;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 600;
    margin-top: 6px;
  }}
  .badge-community {{ background: #283e58; color: #72b3ff; }}
  .badge-degree {{ background: #3c2a4f; color: #d094ff; }}
  .neighbors-list {{
    list-style: none;
    margin-top: 8px;
  }}
  .neighbor-item {{
    padding: 6px 8px;
    background: #141426;
    border-radius: 4px;
    margin-bottom: 4px;
    font-size: 11px;
    cursor: pointer;
    word-break: break-all;
    border-left: 2px solid #4da3ff;
  }}
  .neighbor-item:hover {{
    background: #20203a;
  }}
  .controls {{
    padding: 12px 16px;
    background: #1a1a32;
    border-top: 1px solid #282846;
    display: flex;
    gap: 8px;
  }}
  .btn {{
    flex: 1;
    background: #252542;
    border: 1px solid #3b3b64;
    color: #e0e0e0;
    padding: 6px 10px;
    border-radius: 6px;
    font-size: 11px;
    cursor: pointer;
    transition: background 0.2s;
  }}
  .btn:hover {{
    background: #36365e;
  }}
</style>
</head>
<body>

<div id="graph-container">
  <div id="graph"></div>
</div>

<div id="sidebar">
  <div class="sidebar-header">
    <h2>🌐 Graphify Visualizer</h2>
    <p>Project: <b>{project_name}</b></p>
  </div>
  <div id="search-box">
    <input type="text" id="search" placeholder="Search file or node...">
  </div>
  <div id="info-panel">
    <div class="info-title">Selected Node</div>
    <div id="node-details" class="info-card">
      <p style="color: #6d6d8d; font-style: italic;">Click any node on the graph to inspect connections and community details.</p>
    </div>
    <div class="info-title">Connected Neighbors</div>
    <div id="neighbors-container">
      <p style="color: #6d6d8d; font-size: 11px; font-style: italic;">None selected</p>
    </div>
  </div>
  <div class="controls">
    <button class="btn" id="btn-fit">🔍 Fit View</button>
    <button class="btn" id="btn-physics">⚡ Toggle Physics</button>
  </div>
</div>

<script>
  const rawNodes = {nodes_json};
  const rawEdges = {edges_json};

  const communityColors = [
    '#4E79A7', '#F28E2B', '#E15759', '#76B7B2', '#59A14F',
    '#EDC948', '#B07AA1', '#FF9DA7', '#9C755F', '#BAB0AC'
  ];

  const nodes = new vis.DataSet(rawNodes.map(n => {{
    const colorIdx = (n.community_id || 0) % communityColors.length;
    const baseColor = communityColors[colorIdx];
    return {{
      id: n.id,
      label: n.id.split('/').pop(),
      title: n.id,
      shape: 'dot',
      size: 10 + Math.min(25, (n.degree || 1) * 3),
      color: {{
        background: baseColor,
        border: '#ffffff',
        highlight: {{ background: '#ffffff', border: baseColor }}
      }},
      font: {{ color: '#e0e0e0', size: 11, strokeWidth: 2, strokeColor: '#0f0f1a' }},
      fullData: n
    }};
  }}));

  const edges = new vis.DataSet(rawEdges.map((e, idx) => ({{
    id: 'e_' + idx,
    from: e.source,
    to: e.target,
    arrows: 'to',
    color: {{ color: '#3f3f63', highlight: '#7cb5ec' }},
    width: 1.5,
    smooth: {{ type: 'continuous' }}
  }})));

  const container = document.getElementById('graph');
  const data = {{ nodes, edges }};
  const options = {{
    nodes: {{ borderWidth: 1.5 }},
    edges: {{ selectionWidth: 2 }},
    physics: {{
      stabilization: true,
      barnesHut: {{
        gravitationalConstant: -3500,
        centralGravity: 0.3,
        springLength: 95,
        springConstant: 0.04
      }}
    }},
    interaction: {{
      hover: true,
      tooltipDelay: 100
    }}
  }};

  const network = new vis.Network(container, data, options);

  let physicsEnabled = true;
  document.getElementById('btn-physics').addEventListener('click', () => {{
    physicsEnabled = !physicsEnabled;
    network.setOptions({{ physics: {{ enabled: physicsEnabled }} }});
  }});

  document.getElementById('btn-fit').addEventListener('click', () => {{
    network.fit({{ animation: true }});
  }});

  network.on('click', (params) => {{
    if (params.nodes.length > 0) {{
      const nodeId = params.nodes[0];
      const node = nodes.get(nodeId);
      displayNodeInfo(node);
    }}
  }});

  function displayNodeInfo(node) {{
    const d = node.fullData;
    const connectedEdges = network.getConnectedEdges(node.id);
    const connectedNodes = network.getConnectedNodes(node.id);

    document.getElementById('node-details').innerHTML = `
      <b>${{d.id}}</b><br>
      <span class="badge badge-community">Community: ${{d.community || 'General'}}</span>
      <span class="badge badge-degree">Connections: ${{connectedNodes.length}}</span>
    `;

    const neighborsList = connectedNodes.map(nId => `
      <div class="neighbor-item" onclick="focusNode('${{nId}}')">
        ➜ ${{nId}}
      </div>
    `).join('');

    document.getElementById('neighbors-container').innerHTML = neighborsList || '<p style="color: #666; font-size: 11px;">No connected neighbors</p>';
  }}

  window.focusNode = function(id) {{
    network.focus(id, {{ scale: 1.2, animation: true }});
    const node = nodes.get(id);
    if (node) displayNodeInfo(node);
  }};

  document.getElementById('search').addEventListener('input', (e) => {{
    const query = e.target.value.trim().toLowerCase();
    if (!query) return;
    const found = rawNodes.find(n => n.id.toLowerCase().includes(query));
    if (found) {{
      focusNode(found.id);
    }}
  }});
</script>
</body>
</html>"""

def run_graphify(target_dir="."):
    target_path = Path(target_dir).resolve()
    print(f"➜ Scanning codebase for Graphify analysis at: {target_path}")

    # Check if official graphify CLI is installed
    official_cli = shutil.which("graphify")
    if official_cli:
        print(f"ℹ Found official Graphify CLI: {official_cli}")
        try:
            print("🚀 Running official Graphify engine...")
            res = subprocess.run([official_cli, "update", str(target_path)], capture_output=True, text=True)
            if res.returncode == 0:
                print(res.stdout)
                print("✔ Official Graphify run completed successfully!")
                return
        except Exception as e:
            print(f"⚠ Official CLI run had an issue ({e}), falling back to internal generator...")

    # Internal robust Graphify generator fallback
    out_dir = target_path / "graphify-out"
    out_dir.mkdir(parents=True, exist_ok=True)

    all_files = []
    for root, dirs, files in os.walk(target_path):
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
        for f in files:
            ext = os.path.splitext(f)[1].lower()
            if ext in CODE_EXTS:
                rel_f = str(Path(root, f).relative_to(target_path)).replace("\\", "/")
                all_files.append((Path(root, f), rel_f))

    nodes = []
    edges = []
    communities = {}
    community_counter = 0

    rel_names = [f[1] for f in all_files]

    # Map nodes and edges
    degree_count = {f[1]: 0 for f in all_files}
    for file_path, rel_f in all_files:
        top_dir = rel_f.split("/")[0] if "/" in rel_f else "root"
        if top_dir not in communities:
            communities[top_dir] = community_counter
            community_counter += 1

        try:
            content = file_path.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            content = ""

        deps = detect_imports(rel_f, content, rel_names)
        for dep in deps:
            edges.append({"source": rel_f, "target": dep, "relation": "imports"})
            degree_count[rel_f] += 1
            degree_count[dep] += 1

    for file_path, rel_f in all_files:
        top_dir = rel_f.split("/")[0] if "/" in rel_f else "root"
        nodes.append({
            "id": rel_f,
            "type": "file",
            "community": top_dir,
            "community_id": communities.get(top_dir, 0),
            "degree": degree_count[rel_f]
        })

    graph_data = {
        "project": target_path.name,
        "generated_at": datetime.now().isoformat(),
        "total_nodes": len(nodes),
        "total_edges": len(edges),
        "nodes": nodes,
        "edges": edges
    }

    # 1. Write graph.json
    graph_json_path = out_dir / "graph.json"
    graph_json_path.write_text(json.dumps(graph_data, indent=2), encoding="utf-8")
    print(f"✔ Saved graph dataset: {graph_json_path}")

    # 2. Write graph.html (Interactive Force Directed Visualizer)
    html_content = generate_vis_html(graph_data, target_path.name)
    graph_html_path = out_dir / "graph.html"
    graph_html_path.write_text(html_content, encoding="utf-8")
    print(f"✔ Saved interactive visualization: {graph_html_path}")

    # 3. Write GRAPH_REPORT.md
    sorted_nodes = sorted(nodes, key=lambda x: x["degree"], reverse=True)
    god_nodes = sorted_nodes[:10]

    report_lines = [
        f"# Graph Report - {target_path.name} ({datetime.now().strftime('%Y-%m-%d')})",
        "",
        "## Summary",
        f"- **Nodes:** {len(nodes)} files",
        f"- **Edges (Dependencies):** {len(edges)} connections",
        f"- **Communities (Modules):** {len(communities)} clusters",
        "",
        "## God Nodes (Core Architectural Hubs)",
        "The following files have the highest connectivity across the project:"
    ]
    for idx, gn in enumerate(god_nodes, 1):
        report_lines.append(f"{idx}. `{gn['id']}` - **{gn['degree']}** connections (Module: `{gn['community']}`)")

    report_lines.extend([
        "",
        "## Community Clusters",
        "Grouped project architectural areas:"
    ])
    for comm in sorted(communities.keys()):
        comm_nodes = [n["id"] for n in nodes if n["community"] == comm]
        report_lines.append(f"- **{comm}** ({len(comm_nodes)} files)")

    report_lines.extend([
        "",
        "## Interactive Exploration",
        "- Open `graphify-out/graph.html` directly in your browser to inspect nodes, zoom, search, and navigate module links."
    ])

    report_path = out_dir / "GRAPH_REPORT.md"
    report_path.write_text("\n".join(report_lines), encoding="utf-8")
    print(f"✔ Saved architectural report: {report_path}")

    # 4. Manifest & .gitkeep
    manifest_data = {
        "project": target_path.name,
        "version": "1.0",
        "nodes_count": len(nodes),
        "edges_count": len(edges),
        "updated_at": datetime.now().isoformat()
    }
    (out_dir / "manifest.json").write_text(json.dumps(manifest_data, indent=2), encoding="utf-8")
    (out_dir / ".gitkeep").touch()

    print("\n🎉 Graphify complete! Explore results in 'graphify-out/'.")

if __name__ == '__main__':
    target = sys.argv[1] if len(sys.argv) > 1 else "."
    run_graphify(target)
