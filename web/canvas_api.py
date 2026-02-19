import requests

CANVAS_BASE_URL = "https://canvas.asu.edu"  # or localhost
CANVAS_API_TOKEN = "your_token_here"

HEADERS = {
    "Authorization": f"Bearer {CANVAS_API_TOKEN}",
    "Content-Type": "application/json"
}

def canvas_get(endpoint, params=None):
    """Handles pagination automatically."""
    url = f"{CANVAS_BASE_URL}/api/v1/{endpoint}"
    results = []
    while url:
        response = requests.get(url, headers=HEADERS, params=params)
        response.raise_for_status()
        data = response.json()
        if isinstance(data, list):
            results.extend(data)
        else:
            return data
        # link headers for pagination
        url = None
        if "next" in response.links:
            url = response.links["next"]["url"]
        params = None  # params are already in the next URL
    return results

def canvas_post(endpoint, payload):
    url = f"{CANVAS_BASE_URL}/api/v1/{endpoint}"
    response = requests.post(url, headers=HEADERS, json=payload)
    response.raise_for_status()
    return response.json()