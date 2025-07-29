import { useState, useEffect, useRef } from 'react';

export interface KeyState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
}

export const useKeyPress = () => {
  const [keyboardState, setKeyboardState] = useState<KeyState>({
    up: false,
    down: false,
    left: false,
    right: false,
  });

  const [gamepadState, setGamepadState] = useState<KeyState>({
    up: false,
    down: false,
    left: false,
    right: false,
  });
  
  // キーボードとゲームパッドの状態を統合
  const keyState = {
    up: keyboardState.up || gamepadState.up,
    down: keyboardState.down || gamepadState.down,
    left: keyboardState.left || gamepadState.left,
    right: keyboardState.right || gamepadState.right,
  };
  
  // refでも状態を保持（setIntervalのコールバック内で最新の状態にアクセスするため）
  const keyStateRef = useRef<KeyState>({
    up: false,
    down: false,
    left: false,
    right: false,
  });

  // ゲームパッドのアニメーションフレームID
  const gamepadAnimationRef = useRef<number | undefined>(undefined);

  // stateが変更されたらrefも更新
  useEffect(() => {
    keyStateRef.current = keyState;
  }, [keyState]);

  // ゲームパッドの状態をチェックする関数
  const checkGamepadState = () => {
    const gamepads = navigator.getGamepads();
    let newGamepadState = {
      up: false,
      down: false,
      left: false,
      right: false,
    };

    for (const gamepad of gamepads) {
      if (gamepad) {
        // 方向パッド（D-pad）のチェック
        // ボタン12: 上, ボタン13: 下, ボタン14: 左, ボタン15: 右
        if (gamepad.buttons[12]?.pressed) newGamepadState.up = true;
        if (gamepad.buttons[13]?.pressed) newGamepadState.down = true;
        if (gamepad.buttons[14]?.pressed) newGamepadState.left = true;
        if (gamepad.buttons[15]?.pressed) newGamepadState.right = true;

        // アナログスティック（左スティック）のチェック
        // axes[0]: 左右（-1が左、1が右）, axes[1]: 上下（-1が上、1が下）
        const threshold = 0.5; // スティックの感度閾値
        if (gamepad.axes[0] < -threshold) newGamepadState.left = true;
        if (gamepad.axes[0] > threshold) newGamepadState.right = true;
        if (gamepad.axes[1] < -threshold) newGamepadState.up = true;
        if (gamepad.axes[1] > threshold) newGamepadState.down = true;
      }
    }

    return newGamepadState;
  };

  // ゲームパッドの状態を継続的にチェックする
  const gamepadLoop = () => {
    const newGamepadState = checkGamepadState();
    setGamepadState(newGamepadState);
    gamepadAnimationRef.current = requestAnimationFrame(gamepadLoop);
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowUp':
        setKeyboardState(prev => ({ ...prev, up: true }));
        break;
      case 'ArrowDown':
        setKeyboardState(prev => ({ ...prev, down: true }));
        break;
      case 'ArrowLeft':
        setKeyboardState(prev => ({ ...prev, left: true }));
        break;
      case 'ArrowRight':
        setKeyboardState(prev => ({ ...prev, right: true }));
        break;
      default:
        break;
    }
  };

  const handleKeyUp = (event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowUp':
        setKeyboardState(prev => ({ ...prev, up: false }));
        break;
      case 'ArrowDown':
        setKeyboardState(prev => ({ ...prev, down: false }));
        break;
      case 'ArrowLeft':
        setKeyboardState(prev => ({ ...prev, left: false }));
        break;
      case 'ArrowRight':
        setKeyboardState(prev => ({ ...prev, right: false }));
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // ゲームパッドの監視を開始
    gamepadAnimationRef.current = requestAnimationFrame(gamepadLoop);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      
      // ゲームパッドの監視を停止
      if (gamepadAnimationRef.current) {
        cancelAnimationFrame(gamepadAnimationRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { keyState, keyStateRef };
};
