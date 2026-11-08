"""
ContextRig Web Scraper Tool
Fetches and extracts readable text from a URL.
"""
import sys
import os

# Safe encoding for Windows consoles
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

import requests
from bs4 import BeautifulSoup

DEFAULT_MAX_CHARS = 4000

def scrape(url, max_chars=DEFAULT_MAX_CHARS):
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        response = requests.get(url, headers=headers, timeout=12)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')

        # Unwrap form tags first (prevents ASP.NET form wrappers from killing page content)
        for form in soup.find_all("form"):
            form.unwrap()

        # Strip boilerplate and clutter tags
        for element in soup(["script", "style", "nav", "footer", "header", "aside", "noscript", "iframe", "svg"]):
            element.extract()

        text = soup.get_text(separator=' ', strip=True)
        # Collapse multiple spaces and line breaks into clean single spaces
        text = ' '.join(text.split())

        if len(text) > max_chars:
            text = text[:max_chars] + f"\n\n[...Content truncated at {max_chars} chars to conserve tokens...]"

        print(text)
    except Exception as e:
        print(f"Error scraping {url}: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python scraper.py <url> [max_chars]")
        sys.exit(1)

    limit = int(sys.argv[2]) if len(sys.argv) > 2 and sys.argv[2].isdigit() else DEFAULT_MAX_CHARS
    scrape(sys.argv[1], limit)
