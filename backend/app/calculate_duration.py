import os
import struct

def get_webm_duration(filepath):
    """Extract duration from WebM file by parsing EBML structure."""
    try:
        file_size = os.path.getsize(filepath)
        if file_size < 1000:  # Too small
            return None
            
        with open(filepath, 'rb') as f:
            # Read first 1MB to find duration
            data = f.read(min(file_size, 1024 * 1024))
            
            # Look for Duration element (0x4489)
            duration_marker = b'\x44\x89'
            pos = data.find(duration_marker)
            
            if pos != -1:
                # Skip marker and size byte
                pos += 2
                size_byte = data[pos]
                pos += 1
                
                # Read duration as float (8 bytes typically)
                if size_byte == 0x88:  # 8 bytes
                    duration_bytes = data[pos:pos+8]
                    duration_ns = struct.unpack('>d', duration_bytes)[0]
                    return duration_ns / 1000  # Convert to seconds (it's in ms)
                elif size_byte == 0x84:  # 4 bytes
                    duration_bytes = data[pos:pos+4]
                    duration_ns = struct.unpack('>f', duration_bytes)[0]
                    return duration_ns / 1000
                    
        # Fallback: estimate from file size (rough: ~100KB per second for webm)
        return file_size / (100 * 1024)
        
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
        return None

recordings_dir = "uploads/recordings"
total_seconds = 0
file_count = 0

print("Recording Durations:")
print("-" * 50)

for filename in sorted(os.listdir(recordings_dir)):
    if filename.endswith('.webm'):
        filepath = os.path.join(recordings_dir, filename)
        duration = get_webm_duration(filepath)
        file_size_mb = os.path.getsize(filepath) / (1024 * 1024)
        
        if duration:
            minutes = duration / 60
            total_seconds += duration
            file_count += 1
            print(f"{filename}: {minutes:.1f} min ({file_size_mb:.1f} MB)")
        else:
            print(f"{filename}: Unable to determine ({file_size_mb:.1f} MB)")

print("-" * 50)
print(f"Total: {file_count} recordings")
print(f"Total Duration: {total_seconds/60:.1f} minutes ({total_seconds/3600:.2f} hours)")
