import React, { useState, useEffect, useRef } from "react";

interface SystemData {
  temperature: string;
  voltage: string;
  clock: string;
  image: string;
}

const App: React.FC = () => {
  const [ip, setIp] = useState(""); // 入力されたIPアドレス
  const [connected, setConnected] = useState(false);
  const [data, setData] = useState<SystemData | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  const connectToServer = () => {
    const url = `ws://${ip}:8765`;
    const socket = new WebSocket(url);
    socketRef.current = socket;

    socket.onopen = () => {
      setConnected(true);
      console.log("🔗 接続成功！");
    };

    socket.onmessage = (event) => {
      try {
        const parsed: SystemData = JSON.parse(event.data);
        setData(parsed);
      } catch (err) {
        console.error("⚠️ JSONのパースに失敗:", err);
      }
    };

    socket.onerror = () => {
      console.error("🚨 WebSocket エラー！");
      setConnected(false);
    };

    socket.onclose = () => {
      console.log("🔌 切断されたわ");
      setConnected(false);
    };
  };

  const disconnect = () => {
    socketRef.current?.close();
    socketRef.current = null;
    setConnected(false);
    setData(null);
  };

  return (
    <div style={{ padding: "1rem", fontFamily: "sans-serif", maxWidth: "600px", margin: "auto" }}>
      <h2>📡 Raspberry Pi モニター</h2>

      <div style={{ marginBottom: "1rem" }}>
        <input
          type="text"
          placeholder="例: 192.168.1.42"
          value={ip}
          onChange={(e) => setIp(e.target.value)}
          disabled={connected}
          style={{ padding: "0.5rem", fontSize: "1rem", width: "60%" }}
        />
        {!connected ? (
          <button
            onClick={connectToServer}
            style={{ marginLeft: "0.5rem", padding: "0.5rem", fontSize: "1rem" }}
          >
            接続
          </button>
        ) : (
          <button
            onClick={disconnect}
            style={{ marginLeft: "0.5rem", padding: "0.5rem", fontSize: "1rem" }}
          >
            切断
          </button>
        )}
      </div>

      {connected ? (
        data ? (
          <div>
            <p>🌡 温度: {data.temperature}</p>
            <p>⚡ 電圧: {data.voltage}</p>
            <p>🕓 クロック: {data.clock}</p>
            <img
              src={`data:image/jpeg;base64,${data.image}`}
              alt="カメラ画像"
              style={{ width: "100%", borderRadius: "8px", border: "1px solid #ccc" }}
            />
          </div>
        ) : (
          <p>⏳ データ受信中…</p>
        )
      ) : (
        <p>🔌 接続されていません</p>
      )}
    </div>
  );
};

export default App;