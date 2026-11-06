"""
ContextRig Web Scraper Tool
Fetches and extracts readable text from a URL.
"""
import sys
import requests
from bs4 import BeautifulSoup

def scrape(url):
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Remove script and style elements
        for script in soup(["script", "style"]):
            script.extract()
            
        text = soup.get_text(separator=' ', strip=True)
        print(text)
    except Exception as e:
        print(f"Error scraping {url}: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python scraper.py <url>")
        sys.exit(1)
    scrape(sys.argv[1])

