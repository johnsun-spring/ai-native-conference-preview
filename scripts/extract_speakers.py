#!/usr/bin/env python3
"""
Extract speaker data from legacy HTML files and create a comprehensive speakers.json
"""

import re
import json
import html
from pathlib import Path

def extract_speakers_from_html(html_content, year):
    """Extract speaker data from HTML content."""
    speakers = []
    
    # Pattern to match speaker divs with their content
    # Match each speakers-div block
    speaker_pattern = r'<div class="speakers-div">.*?<img[^>]*src="([^"]*)"[^>]*>.*?<span class="speaker-title">([^<]*)</span><span class="raj-date-first-ever-former-deputy-of-cfpb-1">([^<]*)</span>.*?<a href="([^"]*)"[^>]*class="linkedin[^"]*".*?<p[^>]*class="accordion-paragraph"[^>]*>([^<]*(?:<br>|<[^>]*>)*[^<]*)</p>'
    
    # Simpler approach: find all speaker blocks
    # Split by speakers-div
    speaker_blocks = html_content.split('<div class="speakers-div">')
    
    for block in speaker_blocks[1:]:  # Skip first empty split
        try:
            # Extract image
            img_match = re.search(r'<img[^>]*src="([^"]*)"', block)
            photo = img_match.group(1) if img_match else ""
            
            # Extract name
            name_match = re.search(r'<span class="speaker-title">([^<]*(?:<br>)?[^<]*)</span>', block)
            if not name_match:
                continue
            name = name_match.group(1).replace('<br>', '').strip()
            name = html.unescape(name)
            
            # Skip placeholder entries
            if name == "John Doe" or not name:
                continue
            
            # Extract title/company
            title_match = re.search(r'<span class="raj-date-first-ever-former-deputy-of-cfpb-1">([^<]*(?:<br>)?[^<]*)</span>', block)
            title_company = title_match.group(1).replace('<br>', ' ').strip() if title_match else ""
            title_company = html.unescape(title_company)
            
            # Parse title and company
            parts = title_company.split(',', 1)
            if len(parts) == 2:
                title = parts[0].strip()
                company = parts[1].strip()
            else:
                # Try to parse "Title, Company" or just keep as title
                title = title_company
                company = ""
            
            # Extract LinkedIn
            linkedin_match = re.search(r'<a href="([^"]*)"[^>]*class="linkedin', block)
            linkedin = linkedin_match.group(1) if linkedin_match else ""
            # Clean up generic linkedin URLs
            if linkedin == "https://www.linkedin.com/" or linkedin == "#":
                linkedin = ""
            
            # Extract bio
            bio_match = re.search(r'<p[^>]*class="accordion-paragraph"[^>]*>(.*?)</p>', block, re.DOTALL)
            bio = ""
            if bio_match:
                bio = bio_match.group(1)
                # Clean up HTML tags
                bio = re.sub(r'<br\s*/?>', '\n', bio)
                bio = re.sub(r'<[^>]+>', '', bio)
                bio = html.unescape(bio)
                bio = bio.strip()
            
            # Create speaker ID
            speaker_id = name.lower()
            speaker_id = re.sub(r'[^a-z0-9\s]', '', speaker_id)
            speaker_id = re.sub(r'\s+', '-', speaker_id)
            
            speaker = {
                "id": speaker_id,
                "name": name,
                "title": title,
                "company": company,
                "photo": photo,
                "linkedin": linkedin,
                "bio": bio,
                "year": year,
                "featured": False,
                "order": 999
            }
            
            speakers.append(speaker)
            
        except Exception as e:
            print(f"Error parsing speaker block: {e}")
            continue
    
    return speakers

def merge_speakers(speakers_2024, speakers_2025):
    """Merge speakers from both years, handling duplicates."""
    merged = {}
    
    # First add 2024 speakers
    for speaker in speakers_2024:
        key = speaker["name"].lower().strip()
        speaker["year"] = "2024"
        merged[key] = speaker
    
    # Then add/update with 2025 speakers
    for speaker in speakers_2025:
        key = speaker["name"].lower().strip()
        if key in merged:
            # Speaker exists in both years
            merged[key]["year"] = "2024, 2025"
            # Prefer 2025 photo if available
            if speaker["photo"] and not speaker["photo"].startswith("images/Photo-Placeholder"):
                merged[key]["photo"] = speaker["photo"]
            # Prefer 2025 bio if it's longer
            if len(speaker.get("bio", "")) > len(merged[key].get("bio", "")):
                merged[key]["bio"] = speaker["bio"]
            # Update title/company if available
            if speaker["title"] and not merged[key]["title"]:
                merged[key]["title"] = speaker["title"]
            if speaker["company"] and not merged[key]["company"]:
                merged[key]["company"] = speaker["company"]
            if speaker["linkedin"] and not merged[key]["linkedin"]:
                merged[key]["linkedin"] = speaker["linkedin"]
        else:
            speaker["year"] = "2025"
            merged[key] = speaker
    
    return list(merged.values())

def main():
    base_path = Path("/Users/johnsun/Documents/ai-native-conference/ai-native-conference-2025")
    
    # Read 2024 speakers (speakers.html)
    with open(base_path / "speakers.html", "r", encoding="utf-8") as f:
        html_2024 = f.read()
    
    # Read 2025 speakers (speakers-new.html)
    with open(base_path / "speakers-new.html", "r", encoding="utf-8") as f:
        html_2025 = f.read()
    
    print("Extracting speakers from speakers.html (2024)...")
    speakers_2024 = extract_speakers_from_html(html_2024, "2024")
    print(f"Found {len(speakers_2024)} speakers from 2024")
    
    print("\nExtracting speakers from speakers-new.html (2025)...")
    speakers_2025 = extract_speakers_from_html(html_2025, "2025")
    print(f"Found {len(speakers_2025)} speakers from 2025")
    
    print("\nMerging speakers...")
    all_speakers = merge_speakers(speakers_2024, speakers_2025)
    print(f"Total unique speakers: {len(all_speakers)}")
    
    # Sort by name
    all_speakers.sort(key=lambda x: x["name"])
    
    # Add order numbers
    for i, speaker in enumerate(all_speakers):
        speaker["order"] = i
    
    # Print sample
    print("\n--- Sample speakers ---")
    for speaker in all_speakers[:5]:
        print(f"  {speaker['name']} ({speaker['year']}) - {speaker['photo']}")
    
    # Save to JSON
    output_path = Path("/Users/johnsun/Documents/ai-native-conference/data/speakers_extracted.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(all_speakers, f, indent=2, ensure_ascii=False)
    
    print(f"\nSaved {len(all_speakers)} speakers to {output_path}")
    
    # Also print list of all unique photos
    print("\n--- All unique photos ---")
    photos = set(s["photo"] for s in all_speakers if s["photo"])
    for photo in sorted(photos)[:20]:
        print(f"  {photo}")
    print(f"  ... ({len(photos)} total unique photos)")

if __name__ == "__main__":
    main()


