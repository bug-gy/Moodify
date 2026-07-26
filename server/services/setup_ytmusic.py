#!/usr/bin/env python3
"""
Setup script for YouTube Music API authentication.
Extracts browser cookies and creates auth headers file for ytmusicapi.
"""
import hashlib
import json
import os
import sys
import time

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
AUTH_FILE = os.path.join(SCRIPT_DIR, 'ytmusic_headers.json')


def generate_sapisidhash(sapisid):
    timestamp = int(time.time())
    hash_input = f"{timestamp} {sapisid}"
    hash_output = hashlib.sha1(hash_input.encode()).hexdigest()
    return f"SAPISIDHASH {timestamp}_{hash_output}"


def try_browser_cookies():
    try:
        import browser_cookie3
    except ImportError:
        return None, None

    for domain in ['.youtube.com', 'music.youtube.com']:
        for browser_fn in [
            lambda: browser_cookie3.chrome(domain_name=domain),
            lambda: browser_cookie3.firefox(domain_name=domain),
            lambda: browser_cookie3.brave(domain_name=domain),
            lambda: browser_cookie3.edge(domain_name=domain),
            lambda: browser_cookie3.opera(domain_name=domain),
        ]:
            try:
                cookies = browser_fn()
                cookie_dict = {c.name: c.value for c in cookies}
                cookie_str = '; '.join([f'{c.name}={c.value}' for c in cookies])
                sapisid = cookie_dict.get('SAPISID') or cookie_dict.get('__Secure-3PAPISID')
                return cookie_str, sapisid
            except Exception:
                continue
    return None, None


def create_headers(cookie_str, sapisid):
    headers = {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.5',
        'Content-Type': 'application/json',
        'X-Goog-AuthUser': '0',
        'x-origin': 'https://music.youtube.com',
        'Cookie': cookie_str,
    }
    if sapisid:
        headers['Authorization'] = generate_sapisidhash(sapisid)
    return headers


def manual_instructions():
    print()
    print("=" * 60)
    print("Manual Authentication")
    print("=" * 60)
    print()
    print("Automatic cookie extraction failed. To authenticate manually:")
    print()
    print("1. Open Chrome/Firefox and go to https://music.youtube.com")
    print("2. Sign in to your Google account")
    print("3. Open Developer Tools (F12) → Network tab")
    print("4. Refresh the page")
    print("5. Click on any request to music.youtube.com")
    print("6. Find the 'Cookie' and 'Authorization' headers")
    print("7. Run this script with those values:")
    print()
    print(f"  python3 {sys.argv[0]} --cookie \"COOKIE_VALUE\" --auth \"AUTH_VALUE\"")
    print()


def main():
    if len(sys.argv) > 4 and sys.argv[1] == '--cookie' and sys.argv[3] == '--auth':
        cookie = sys.argv[2]
        sapisidhash = sys.argv[4]
        headers = {
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': '*/*',
            'Accept-Language': 'en-US,en;q=0.5',
            'Content-Type': 'application/json',
            'X-Goog-AuthUser': '0',
            'x-origin': 'https://music.youtube.com',
            'Cookie': cookie,
            'Authorization': sapisidhash,
        }
        with open(AUTH_FILE, 'w') as f:
            json.dump(headers, f, indent=2)
        print(f"Auth headers saved to {AUTH_FILE}")
        print("Authentication successful!")
        return

    print("=" * 60)
    print("YouTube Music Authentication Setup")
    print("=" * 60)
    print()
    print("Attempting to extract cookies from your browser...")
    print()

    cookie_str, sapisid = try_browser_cookies()

    if cookie_str and sapisid:
        headers = create_headers(cookie_str, sapisid)
        with open(AUTH_FILE, 'w') as f:
            json.dump(headers, f, indent=2)
        print(f"Cookies extracted successfully!")
        print(f"Auth headers saved to: {AUTH_FILE}")
        print()
        print("You can now use the full YouTube Music API including audio streaming.")
    elif cookie_str and not sapisid:
        print("Found cookies but missing SAPISID token.")
        manual_instructions()
        sys.exit(1)
    else:
        print("Could not automatically extract cookies from any browser.")
        manual_instructions()
        sys.exit(1)


if __name__ == '__main__':
    main()
