import csv
import time
import requests
from datetime import datetime, timedelta

# ===== CONFIG =====
PAGE_ID = "228482657011871"
PAGE_TOKEN = "EAATKWYZCZB1ycBPzSP9j6HkGGfrST7xeSPYNTlTZASSpzGBKG4R6fUlZAVDOPSqHTvZC6ZCZAILKADZBAX1wApup6M8JHspismLSZBuYLb1hyCFPtDkr1bQVViEbUtNqogKGxOSFwrD28DIBFBMHG20uXbjiT7QSV6Lz3lVv0DZCXr3ZAuYL0goZBZCmKUvxe3KYw4qCmxJcZD"
CSV_INPUT = "content_schedule.csv"
CSV_OUTPUT = "scheduled_output.csv"

# Spacing rules
POST_SPACING_MIN = 30
REEL_SPACING_MIN = 120
MIN_SCHEDULE_DELAY_MIN = 10  # Facebook requires at least 10 min in the future

# ===== FUNCTIONS =====
def schedule_post(message, link, post_type, scheduled_time):
    """Schedules a post or reel/video and returns the full API response"""
    # Ensure schedule time is at least 10 minutes in the future
    min_time = datetime.now() + timedelta(minutes=MIN_SCHEDULE_DELAY_MIN)
    if scheduled_time < min_time:
        scheduled_time = min_time

    timestamp = int(scheduled_time.timestamp())
    
    if post_type == "video":
        url = f"https://graph.facebook.com/v17.0/{PAGE_ID}/videos"
        payload = {
            "description": message,
            "file_url": link,
            "published": False,
            "scheduled_publish_time": timestamp,
            "access_token": PAGE_TOKEN
        }
    else:
        url = f"https://graph.facebook.com/v17.0/{PAGE_ID}/feed"
        payload = {
            "message": message,
            "link": link,
            "published": False,
            "scheduled_publish_time": timestamp,
            "access_token": PAGE_TOKEN
        }

    response = requests.post(url, data=payload)
    try:
        result = response.json()
    except Exception as e:
        result = {"error": f"Failed to parse response: {e}", "status_code": response.status_code}
    
    # Print full response for debugging
    print(f"Scheduling {post_type} at {scheduled_time}: {result}")
    return result

# ===== MAIN =====
def main():
    # Read CSV
    with open(CSV_INPUT, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        items = list(reader)

    # Separate posts and reels/videos
    posts = [item for item in items if item['type'] != 'video']
    reels = [item for item in items if item['type'] == 'video']

    scheduled_data = []

    # Initialize times
    current_time = datetime.now() + timedelta(minutes=MIN_SCHEDULE_DELAY_MIN)

    # Alternate scheduling
    max_len = max(len(posts), len(reels))
    for i in range(max_len):
        if i < len(posts):
            post_item = posts[i]
            result = schedule_post(post_item['description'], post_item['direct_download_link'], post_item['type'], current_time)
            post_item['scheduled_time'] = current_time.strftime("%Y-%m-%d %H:%M:%S")
            post_item['response'] = result
            scheduled_data.append(post_item)
            # Increment time for next post
            current_time += timedelta(minutes=POST_SPACING_MIN)

        if i < len(reels):
            reel_item = reels[i]
            result = schedule_post(reel_item['description'], reel_item['direct_download_link'], reel_item['type'], current_time)
            reel_item['scheduled_time'] = current_time.strftime("%Y-%m-%d %H:%M:%S")
            reel_item['response'] = result
            scheduled_data.append(reel_item)
            # Increment time for next reel
            current_time += timedelta(minutes=REEL_SPACING_MIN)

    # Save output CSV
    fieldnames = list(scheduled_data[0].keys())
    with open(CSV_OUTPUT, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(scheduled_data)

    print(f"Scheduling complete. Check {CSV_OUTPUT} for full responses.")

if __name__ == "__main__":
    main()
