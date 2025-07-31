import { AppShell, Group, Text, Title, Image, Box, TextInput, Button, Stack, Divider, SemiCircleProgress } from "@mantine/core";
import { LineChart } from "@mantine/charts";

import React, {useState, useRef} from "react";
import style from "./App.module.scss";
import { useKeyPress } from "./hooks/useKeyPress";
import { getKeyStateMessage } from "./utils/keyUtils";
import  SemiCircleBar from "./semiCircle";

interface RaspiData {
  throttled: number;
  temperature: number | null;
  voltage: {
    core: number | null;
    sdram: number | null;
    sdram_i: number | null;
    sdram_p: number | null;
  } | null;
  frequency: number | null;
  image: string | null;
}

const App: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [ip, setIp] = useState("");

  const [throttled, setThrottled] = useState<number>(0x0);
  const [temperature, setTemperature] = useState<number | null>(null);
  const [voltage, setVoltage] = useState<{
    core: number | null;
    sdram: number | null;
    sdram_i: number | null;
    sdram_p: number | null;
  } | null>(null);
  const [frequency, setFrequency] = useState<number | null>(null);
  const [cameraData, setCameraData] = useState<string | null>(null);
  const [coreVoltageHistory, setCoreVoltageHistory] = useState<Array<{time: string, voltage: number}>>([]);
  const [frequencyHistory, setFrequencyHistory] = useState<Array<{time: string, frequency: number}>>([]);
  const { keyState, keyStateRef } = useKeyPress();
  const socketRef = useRef<WebSocket | null>(null);
  const intervalRef = useRef<number | null>(null);

  const connect = () => {
    if (isConnected && socketRef.current) {
      // 切断処理
      socketRef.current.close();
      return;
    }

    // 接続処理
    const url = `ws://${ip}:8765`;
    const socket = new WebSocket(url);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log("接続成功！");
      setIsConnected(true);
      
      // 0.1秒ごとにキーの状態をチェックして送信
      intervalRef.current = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          const message = getKeyStateMessage(keyStateRef.current);
          socket.send(message);
        }
      }, 100);
    };

    socket.onmessage = (event) => {
      // console.log(`📨 受信: ${event.data}`);
      // throttled状態の更新処理をここに追加可能
      const parsed = JSON.parse(event.data);
      setThrottled(parsed.throttled)
      setTemperature(parsed.temperature);
      setVoltage(parsed.voltage);
      setFrequency(parsed.frequency);
      setCameraData(parsed.image);
      
      // core電圧の履歴を更新（直近10件のみ保持）
      if (parsed.voltage?.core !== null && parsed.voltage?.core !== undefined) {
        const now = new Date();
        const timeString = now.toLocaleTimeString();
        setCoreVoltageHistory(prev => {
          const newHistory = [...prev, { time: timeString, voltage: parsed.voltage.core }];
          return newHistory.slice(-10); // 直近10件のみ保持
        });
      }
      
      // 周波数の履歴を更新（直近10件のみ保持）
      if (parsed.frequency !== null && parsed.frequency !== undefined) {
        const now = new Date();
        const timeString = now.toLocaleTimeString();
        setFrequencyHistory(prev => {
          const newHistory = [...prev, { time: timeString, frequency: parsed.frequency }];
          return newHistory.slice(-10); // 直近10件のみ保持
        });
      }
    };

    socket.onerror = () => {
      console.log("⚠️ 接続エラー！");
      // インターバルをクリア
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    socket.onclose = () => {
      console.log("🔌 接続終了");
      setIsConnected(false);
      
      // インターバルをクリア
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  };
  return (
    <AppShell
      padding="md"
      header={{ height: 60}}
      footer={{ height: 30 }}
      >
        <AppShell.Header>
            <Group align="flex-end" justify="space-between" px="md">
            <Title order={1} className={style.title} >
              Raspi-Monitor
            </Title>
            </Group>
        </AppShell.Header>
        <AppShell.Main w="100vw" h="100%">
          <Stack>
            <Group h="50%" align="center" justify="space-between" px="md">
              <Box w="300">
                <Stack>
                  <Title order={3}>WebSocket Connection</Title>
                  <Group align="flex-end">
                    <TextInput
                      placeholder="ex: 192.168.1.42"
                      value={ip}
                      onChange={(e) => setIp(e.target.value)}
                      label="Server IP"
                      w={150}
                    />
                    <Button 
                      onClick={connect}
                      color={isConnected ? "red" : "blue"}
                      disabled={!ip}
                    >
                      {isConnected ? "Disconnect" : "Connect"}
                    </Button> 
                  </Group>
                  <Stack gap={0}>
                    <Title order={5}>Raspberry Pi Status</Title>
                    <Stack gap={0} m="0 md">
                      <Group>
                        <Text c={isConnected && throttled & 0x1 ? "" : "dimmed"} fw={isConnected && throttled & 0x1 ? "bold" : "normal"} w="225">
                          Undervoltage detected:
                        </Text>
                        <Text c={isConnected && throttled & 0x1 ? "" : "dimmed"} fw={isConnected && throttled & 0x1 ? "bold" : "normal"}>
                          {throttled & 0x1 ? "Yes" : "No"}
                        </Text>
                      </Group>
                      <Group>
                        <Text c={isConnected && throttled & 0x2 ? "" : "dimmed"} fw={isConnected && throttled & 0x2 ? "bold" : "normal"} w="225">
                          Arm frequency capped:
                        </Text>
                        <Text c={isConnected && throttled & 0x2 ? "" : "dimmed"} fw={isConnected && throttled & 0x2 ? "bold" : "normal"}>
                          {throttled & 0x2 ? "Yes" : "No"}
                        </Text>
                      </Group>
                      <Group>
                        <Text c={isConnected && throttled & 0x4 ? "" : "dimmed"} fw={isConnected && throttled & 0x4 ? "bold" : "normal"} w="225">
                          Currently throttled:
                        </Text>
                        <Text c={isConnected && throttled & 0x4 ? "" : "dimmed"} fw={isConnected && throttled & 0x4 ? "bold" : "normal"}>
                          {throttled & 0x4 ? "Yes" : "No"}
                        </Text>
                      </Group>
                      <Group>
                        <Text c={isConnected && throttled & 0x8 ? "" : "dimmed"} fw={isConnected && throttled & 0x8 ? "bold" : "normal"} w="225">
                          Soft temperature limit active:
                        </Text>
                        <Text c={isConnected && throttled & 0x8 ? "" : "dimmed"} fw={isConnected && throttled & 0x8 ? "bold" : "normal"}>
                          {throttled & 0x8 ? "Yes" : "No"}
                        </Text>
                      </Group>
                    </Stack>
                  </Stack>
                </Stack>
              </Box>
              <Divider orientation="vertical" />
              <Box
                  w="calc((100% - 300px) / 4)"
                  h="50%"
                  >
                <Stack align="center" justify="center">
                  <SemiCircleBar
                    value={temperature !== null ? temperature : 20}
                    strokeWidth={15}
                    responsive={true}
                  />
                  <Text size="sm">
                    {isConnected && temperature !== null ? `Temperature: ${temperature} °C` : "No data available"}
                  </Text>
                </Stack>
              </Box>
              <Divider orientation="vertical" />
              <Box
                w="calc((100% - 300px) / 4)"
                h="50%"
                >
                <Stack align="center" justify="center">
                  <LineChart
                    h={180}
                    data={coreVoltageHistory}
                    dataKey="time"
                    series={[
                      { name: 'voltage', color: 'blue.6' }
                    ]}
                    yAxisProps={{ domain: [0.8, 1.4] }}
                    curveType="monotone"
                  />
                  <Text size="sm">
                    {isConnected && coreVoltageHistory.length > 0 ? "Core Voltage (V)" : "No data available"}
                  </Text>
                </Stack>
              </Box>
              <Divider orientation="vertical" />
              <Box
                w="calc((100% - 300px) / 4)"
                h="50%"
                >
                <Stack align="center" justify="center">
                  <LineChart
                    h={180}
                    data={frequencyHistory}
                    dataKey="time"
                    series={[
                      { name: 'frequency', color: 'green.6' }
                    ]}
                    yAxisProps={{ domain: [600, 1500] }}
                    curveType="monotone"
                  />
                  <Text size="sm">
                    {isConnected && frequencyHistory.length > 0 ? "CPU Frequency (MHz)" : "No data available"}
                  </Text>
                </Stack>
              </Box>
            </Group>
            <Box w="30%" h="20%">
              <Image
              src={`data:image/jpeg;base64,${cameraData}`}
              h="100%"
              w="100%"
              alt="Raspi-Monitor Logo"
              fit="cover"
              fallbackSrc="https://placehold.co/600x400?text=no+camera+available"
              style={{ transform: cameraData ? "scaleY(-1)" : ""}}
              />
            </Box>
          </Stack>
        </AppShell.Main>
        <AppShell.Footer>
          <Group justify="right" px="md">
            <Text>
              © 2025 FROM THE EARTH. All rights reserved.
            </Text>
          </Group>
        </AppShell.Footer>
    </AppShell>
  )
}

export default App
