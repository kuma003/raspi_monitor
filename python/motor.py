import RPi.GPIO as GPIO
import json

json_data = json.loads(open("config.json", "r").read())
# モーターピン定義
left_motor_forward = json_data["left_motor_forward"]
left_motor_backward = json_data["left_motor_backward"]
right_motor_forward = json_data["right_motor_forward"]
right_motor_backward = json_data["right_motor_backward"]

# PWMオブジェクト
pwm_left_forward = None
pwm_left_backward = None
pwm_right_forward = None
pwm_right_backward = None

# 初期速度（0-100%）
speed = 50


# GPIOの設定
def setup(
    left_motor_forward, left_motor_backward, right_motor_forward, right_motor_backward
):
    global pwm_left_forward, pwm_left_backward, pwm_right_forward, pwm_right_backward

    GPIO.setmode(GPIO.BCM)
    GPIO.setwarnings(False)

    # ピンをセットアップ
    GPIO.setup(left_motor_forward, GPIO.OUT)
    GPIO.setup(left_motor_backward, GPIO.OUT)
    GPIO.setup(right_motor_forward, GPIO.OUT)
    GPIO.setup(right_motor_backward, GPIO.OUT)
    # PWMオブジェクトを作成（周波数100Hz）
    pwm_left_forward = GPIO.PWM(left_motor_forward, 100)
    pwm_left_backward = GPIO.PWM(left_motor_backward, 100)
    pwm_right_forward = GPIO.PWM(right_motor_forward, 100)
    pwm_right_backward = GPIO.PWM(right_motor_backward, 100)

    # PWM信号を0%で開始
    pwm_left_forward.start(0)
    pwm_left_backward.start(0)
    pwm_right_forward.start(0)
    pwm_right_backward.start(0)

    stop()


# 前進
def forward(speed=50):
    pwm_left_forward.ChangeDutyCycle(speed)
    pwm_left_backward.ChangeDutyCycle(0)
    pwm_right_forward.ChangeDutyCycle(speed)
    pwm_right_backward.ChangeDutyCycle(0)


# 後退
def backward(speed=50):
    pwm_left_forward.ChangeDutyCycle(0)
    pwm_left_backward.ChangeDutyCycle(speed)
    pwm_right_forward.ChangeDutyCycle(0)
    pwm_right_backward.ChangeDutyCycle(speed)


# 左折
def turn_left(speed=50):
    pwm_left_forward.ChangeDutyCycle(0.5 * speed)
    pwm_left_backward.ChangeDutyCycle(0)
    pwm_right_forward.ChangeDutyCycle(speed)
    pwm_right_backward.ChangeDutyCycle(0)


# 右折
def turn_right(speed=50):
    pwm_left_forward.ChangeDutyCycle(speed)
    pwm_left_backward.ChangeDutyCycle(0)
    pwm_right_forward.ChangeDutyCycle(0.5 * speed)
    pwm_right_backward.ChangeDutyCycle(0)


# 停止
def stop():
    pwm_left_forward.ChangeDutyCycle(0)
    pwm_left_backward.ChangeDutyCycle(0)
    pwm_right_forward.ChangeDutyCycle(0)
    pwm_right_backward.ChangeDutyCycle(0)


def cleanup():
    pwm_left_forward.stop()
    pwm_left_backward.stop()
    pwm_right_forward.stop()
    pwm_right_backward.stop()
    GPIO.cleanup()
    print("clean up completed")
