import React, { useRef, useEffect, useState } from 'react';

interface SemiCircleBarProps {
  value?: number;
  size?: number;
  strokeWidth?: number;
  responsive?: boolean;
}

const SemiCircleBar: React.FC<SemiCircleBarProps> = ({ 
  value = 50, 
  size = 200, 
  strokeWidth = 20, 
  responsive = false 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dynamicSize, setDynamicSize] = useState(size);

  useEffect(() => {
    if (!responsive) return;

    const updateSize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        // strokeWidthを考慮して、少し余裕を持たせる
        const newSize = Math.max(100, containerWidth - strokeWidth);
        setDynamicSize(newSize);
      }
    };

    // 初期サイズ設定
    updateSize();

    // ResizeObserverでリサイズを監視
    const resizeObserver = new ResizeObserver(updateSize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [responsive, strokeWidth]);

  // 値を0-100の範囲に制限
  const clampedValue = Math.max(0, Math.min(100, value));
  
  // 実際に使用するサイズ
  const actualSize = responsive ? dynamicSize : size;
  
  // SVGの設定
  const radius = (actualSize - strokeWidth) / 2;
  const circumference = Math.PI * radius; // 半円なので円周の半分
  const offset = circumference - (clampedValue / 100) * circumference;
  
  // 値に基づいて色を計算（0: 緑 → 50: 黄 → 100: 赤）
  const getColor = (val: number) => {
    if (val <= 50) {
      // 0-50: 緑から黄色へ
      const ratio = val / 50;
      const r = Math.floor(255 * ratio);
      const g = 255;
      const b = 0;
      return `rgb(${r}, ${g}, ${b})`;
    } else {
      // 50-100: 黄色から赤へ
      const ratio = (val - 50) / 50;
      const r = 255;
      const g = Math.floor(255 * (1 - ratio));
      const b = 0;
      return `rgb(${r}, ${g}, ${b})`;
    }
  };
  // グラデーションのためのカラーストップを生成
  const generateGradientStops = () => {
    const stops = [];
    for (let i = 0; i <= 100; i += 10) {
      stops.push(
        <stop
          key={i}
          offset={`${i}%`}
          stopColor={getColor(i)}
        />
      );
    }
    return stops;
  };
  
  return (
    <div ref={containerRef} className="flex flex-col items-center p-8" style={{ width: responsive ? '100%' : 'auto' }}>
      <div className="relative">
        <svg
          width={actualSize}
          height={actualSize / 2 + strokeWidth / 2}
          className="transform -rotate-90"
        >
          {/* グラデーション定義 */}
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              {generateGradientStops()}
            </linearGradient>
          </defs>
          
          {/* 背景の半円 */}
          <path
            d={`M ${strokeWidth / 2} ${actualSize / 2} A ${radius} ${radius} 0 0 1 ${actualSize - strokeWidth / 2} ${actualSize / 2}`}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          
          {/* プログレスの半円 */}
          <path
            d={`M ${strokeWidth / 2} ${actualSize / 2} A ${radius} ${radius} 0 0 1 ${actualSize - strokeWidth / 2} ${actualSize / 2}`}
            fill="none"
            stroke="url(#progressGradient)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        
      </div>
    </div>
  );
};
export default SemiCircleBar;