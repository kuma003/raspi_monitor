import type { KeyState } from '../hooks/useKeyPress';

export const getKeyStateMessage = (keyState: KeyState): string => {
  // 優先度順でチェック: 上 > 右 > 左 > 下
  if (keyState.up) {
    return 'key:up';
  }
  if (keyState.right) {
    return 'key:right';
  }
  if (keyState.left) {
    return 'key:left';
  }
  if (keyState.down) {
    return 'key:down';
  }
  
  return 'key:none';
};
