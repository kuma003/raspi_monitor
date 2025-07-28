import { AppShell, Group, Text, Title, Image, Box } from "@mantine/core";
import React, {useState, useRef} from "react";
import style from "./App.module.scss";


const App: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [ip, setIp] = useState("");
  const [messages, setMessages] = useState<string[]>([]);
  const socketRef = useRef<WebSocket | null>(null);

  const connect = () => {
    const url = `ws://${ip}:8765`;
    const socket = new WebSocket(url);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log("接続成功！");
      socket.send("こんにちは、サーバーさん！");
    };

    socket.onmessage = (event) => {
      setMessages((prev) => [...prev, `📨: ${event.data}`]);
    };

    socket.onerror = () => {
      setMessages((prev) => [...prev, "⚠️ 接続エラー！"]);
    };

    socket.onclose = () => {
      setMessages((prev) => [...prev, "🔌 接続終了"]);
    };
  };
  return (
    <AppShell
      padding="md"
      header={{ height: 60 }}
      footer={{ height: 30 }}
      >
        <AppShell.Header>
            <Group align="flex-end" justify="space-between" px="md">
            <Title order={1} className={style.title} >
              Raspi-Monitor
            </Title>
            </Group>
        </AppShell.Header>
        <AppShell.Main w="100vw">
          <Group>
            <Box w="30%" h="20%">
              <Image
                src=""
                alt="Raspi-Monitor Logo"
                fit="cover"
                fallbackSrc="https://placehold.co/600x400?text=no+camera+available"
              />
            </Box>                      
          </Group>
        </AppShell.Main>
        <AppShell.Footer>
          <Group justify="right" px="md">
            <Text>
              © 2025 FROM THE EARTH all rights reserved.
            </Text>
          </Group>
        </AppShell.Footer>
    </AppShell>
    // <div style={{ padding: "1rem" }}>
    //   <h1>WebSocketクライアント</h1>
    //   <input
    //     type="text"
    //     placeholder="例: 192.168.1.42"
    //     value={ip}
    //     onChange={(e) => setIp(e.target.value)}
    //   />
    //   <button onClick={connect}>接続！</button>

    //   <div style={{ marginTop: "1rem" }}>
    //     <h2>メッセージログ</h2>
    //     <ul>
    //       {messages.map((msg, idx) => (
    //         <li key={idx}>{msg}</li>
    //       ))}
    //     </ul>
    //   </div>
    // </div>
  )
}

export default App
