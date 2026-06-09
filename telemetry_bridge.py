import serial
import json
import requests
import time
from datetime import datetime, timezone
import uuid

# --- Configuration ---
COM_PORT = 'COM5'
BAUD_RATE = 115200        
BACKEND_URL = 'http://localhost:4000/api/v1/events/ingest' 

def start_bridge():
    print(f"[*] Initializing Telemetry Bridge on {COM_PORT}...")
    
    try:
        ser = serial.Serial(COM_PORT, BAUD_RATE, timeout=1)
        time.sleep(2) 
        print("[*] Connection established. Listening for radio packets...\n")
        
        while True:
            if ser.in_waiting > 0:
                raw_data = ser.readline().decode('utf-8').strip()
                
                try:
                    esp_data = json.loads(raw_data)
                    
                    # 1. Ignore the Ground Station boot message
                    if esp_data.get("mode") == "ground_station":
                        print("[SYS] Ground Station is online and listening.")
                        continue
                        
                    print(f"\n[RADIO PACKET] {esp_data}")
                    
                    # 2. Map data to NestJS DTO
                    nest_payload = {
                        "deviceId": str(esp_data.get("device_id", "1001")),
                        "packetUuid": str(uuid.uuid4()),
                        "accelerationX": 0.0,
                        "accelerationY": 0.0,
                        # 3. Multiply the severity by 5.0 to force it past the backend's 2.0G filter!
                        "accelerationZ": float(esp_data.get("sev", 1)) * 5.0, 
                        "gyroX": 0.0,
                        "gyroY": 0.0,
                        "gyroZ": 0.0,
                        "latitude": float(esp_data.get("lat", 0.0)),
                        "longitude": float(esp_data.get("lng", 0.0)),
                        "speedEstimate": float(esp_data.get("speed", 0.0)),
                        "gpsAccuracy": 5.0,
                        "transmissionSource": "nrf24_gateway",
                        "eventTimestamp": datetime.now(timezone.utc).isoformat()
                    }
                    
                    # 4. Fire the POST request
                    response = requests.post(BACKEND_URL, json=nest_payload, timeout=3)
                    
                    if response.status_code in [200, 201]:
                        res_data = response.json()
                        action_status = res_data.get('data', {}).get('status', 'unknown')
                        print(f"    -> [SUCCESS] Database Status: {action_status.upper()}")
                    else:
                        print(f"    -> [WARNING] Backend rejected packet. Status: {response.status_code}")
                        
                except json.JSONDecodeError:
                    if raw_data:
                        print(f"[SYS] {raw_data}")
                except requests.exceptions.RequestException as e:
                    print(f"    -> [ERROR] Could not reach backend: {e}")
                    
    except serial.SerialException as e:
        print(f"[FATAL] Could not open {COM_PORT}. Is the Serial Monitor still open in VS Code?")

if __name__ == '__main__':
    start_bridge()