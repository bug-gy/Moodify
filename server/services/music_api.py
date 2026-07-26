#!/usr/bin/env python3
import json
import sys
import os
import re

from ytmusicapi import YTMusic

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
AUTH_FILE = os.path.join(SCRIPT_DIR, 'ytmusic_headers.json')

def get_yt():
    if os.path.exists(AUTH_FILE):
        return YTMusic(AUTH_FILE)
    return YTMusic()

def parse_duration(dur_str):
    if not dur_str or not isinstance(dur_str, str):
        return 0
    parts = dur_str.strip().split(':')
    try:
        if len(parts) == 3:
            return (int(parts[0]) * 3600 + int(parts[1]) * 60 + int(parts[2])) * 1000
        elif len(parts) == 2:
            return (int(parts[0]) * 60 + int(parts[1])) * 1000
        elif len(parts) == 1:
            return int(parts[0]) * 1000
    except ValueError:
        return 0
    return 0

def cmd_search(args):
    query = ' '.join(args) if args else 'lo fi'
    yt = get_yt()
    results = yt.search(query, filter='songs', limit=20)
    tracks = []
    for r in results:
        if r.get('resultType') != 'song':
            continue
        artists = r.get('artists', [])
        duration = parse_duration(r.get('duration'))
        if duration > 600000:
            continue
        track = {
            'externalApiId': r.get('videoId', ''),
            'apiSource': 'youtube_music',
            'title': r.get('title', ''),
            'artist': artists[0]['name'] if artists else 'Unknown',
            'album': r.get('album', {}).get('name') if r.get('album') else None,
            'artworkUrl': r.get('thumbnails', [{}])[-1].get('url', '') if r.get('thumbnails') else None,
            'streamUrl': None,
            'durationMs': duration,
        }
        tracks.append(track)
    print(json.dumps(tracks))

def cmd_stream(args):
    if not args:
        print(json.dumps({'error': 'videoId required'}))
        sys.exit(1)
    video_id = args[0]
    yt = get_yt()
    stream_url = None
    title = ''
    artist = ''

    try:
        song = yt.get_song(video_id)
        if song:
            title = song.get('videoDetails', {}).get('title', '')
            artist = song.get('videoDetails', {}).get('author', '')
            if 'streamingData' in song:
                for fmt_list in [song['streamingData'].get('adaptiveFormats', []),
                                 song['streamingData'].get('formats', [])]:
                    for fmt in fmt_list:
                        if 'url' in fmt:
                            stream_url = fmt['url']
                            break
                    if stream_url:
                        break
    except Exception:
        pass

    if not stream_url:
        try:
            import yt_dlp
            ydl_opts = {
                'format': 'bestaudio/best',
                'quiet': True,
                'no_warnings': True,
                'extract_flat': False,
            }
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(f'https://www.youtube.com/watch?v={video_id}', download=False)
                if info:
                    stream_url = info.get('url')
                    if not stream_url and info.get('formats'):
                        stream_url = info['formats'][-1].get('url')
                    if not title:
                        title = info.get('title', '')
                    if not artist:
                        artist = info.get('channel', '') or info.get('uploader', '')
        except Exception as e:
            pass

    result = {
        'videoId': video_id,
        'streamUrl': stream_url,
        'title': title,
        'artist': artist,
    }
    print(json.dumps(result))

def cmd_auth_status(args):
    exists = os.path.exists(AUTH_FILE)
    print(json.dumps({'authenticated': exists, 'authFile': AUTH_FILE if exists else None}))

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'Usage: music_api.py <search|stream|auth_status> [args...]'}))
        sys.exit(1)

    command = sys.argv[1]
    args = sys.argv[2:]

    if command == 'search':
        cmd_search(args)
    elif command == 'stream':
        cmd_stream(args)
    elif command == 'auth_status':
        cmd_auth_status(args)
    else:
        print(json.dumps({'error': f'Unknown command: {command}'}))
        sys.exit(1)
