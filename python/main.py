import asyncio
import websockets
import socket
import subprocess
import base64
import json
import threading
from io import BytesIO
from picamera2 import Picamera2
from PIL import Image
import motor

# モーターをセットアップ
motor.setup()

PORT = 8765

# --- カメラスレッド用共有変数 ---
latest_image_b64 = ""
camera_running = True


def get_local_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    s.connect(("8.8.8.8", 80))
    ip = s.getsockname()[0]
    s.close()
    return ip


def get_temperature():
    try:
        with open("/sys/class/thermal/thermal_zone0/temp") as f:
            return int(f.read().strip()) / 1000.0
    except:
        return None


def get_voltage():
    try:
        out = subprocess.check_output(["vcgencmd", "measure_volts"])
        return out.decode().strip().split("=")[1]
    except:
        return None


def get_clock():
    try:
        out = subprocess.check_output(["vcgencmd", "measure_clock", "arm"])
        hz = int(out.decode().strip().split("=")[1])
        return f"{hz / 1_000_000:.0f} MHz"
    except:
        return None


# --- カメラスレッド（最新画像を常に更新） ---
def camera_loop():
    global latest_image_b64, camera_running
    try:
        picam = Picamera2()
        config = picam.create_still_configuration(
            main={"format": "RGB888", "size": (640, 480)}
        )
        picam.configure(config)
        picam.start()

        while camera_running:
            frame = picam.capture_array()
            img = Image.fromarray(frame)
            buf = BytesIO()
            img.save(buf, format="JPEG", quality=70)
            latest_image_b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
    except Exception as e:
        print("📷 カメラエラー:", e)


# --- センサー送信タスク（0.5秒ごと） ---
async def send_sensor_data(websocket):
    while True:
        data = {
            "temperature": (
                f"{get_temperature():.1f} °C" if get_temperature() else "N/A"
            ),
            "voltage": get_voltage() or "N/A",
            "clock": get_clock() or "N/A",
            "image": latest_image_b64 or "",
        }
        await websocket.send(json.dumps(data))
        await asyncio.sleep(0.5)


# --- コマンド受信タスク（GPIO制御） ---
async def receive_commands(websocket):
    async for msg in websocket:
        try:
            print("📥 コマンド受信:", msg)

            if "key" in msg:
                direction = msg.split(":")[1] if ":" in msg else ""
                print(f"💡 key {direction}")
                match direction:
                    case "up":
                        motor.forward()
                    case "right":
                        motor.turn_right()
                    case "left":
                        motor.turn_left()
                    case _:
                        motor.stop()
        except Exception as e:
            print("⚠️ コマンドエラー:", e)


# --- 各クライアントごとに起動される ---
async def handler(websocket):
    print("✅ クライアント接続！")

    # 送信＆受信タスクを並列実行
    await asyncio.gather(send_sensor_data(websocket), receive_commands(websocket))


# --- メインループ ---
async def main():
    ip = get_local_ip()
    print(f"🌐 サーバー起動: ws://{ip}:{PORT}")

    # カメラ用スレッド起動
    camera_thread = threading.Thread(target=camera_loop, daemon=True)
    camera_thread.start()

    async with websockets.serve(handler, "0.0.0.0", PORT, max_size=2**22):
        await asyncio.Future()


# --- 終了処理 ---
if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("👋 終了するよ〜")
    finally:
        camera_running = False
        motor.cleanup()
