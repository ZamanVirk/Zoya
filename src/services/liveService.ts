// liveService.ts

// 1. Hardcoded API Key (Bypassing Vercel Env issues)
const API_KEY = "AIzaSyBRy7Bh6LlUiBmM2TXyn9pVtv71S4hrPCs";
const MODEL_NAME = "models/gemini-2.0-flash-live-001";
const WS_URL = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${API_KEY}`;

class LiveService {
  private socket: WebSocket | null = null;
  private isConnected = false;
  private reconnectTimeout: any = null;
  private canSendAudio = false;

  constructor() {
    this.connect();
  }

  public connect() {
    if (this.socket) {
      this.socket.close();
    }

    console.log("Live API Connecting...");
    this.socket = new WebSocket(WS_URL);

    this.socket.onopen = () => {
      console.log("Live API Connected");
      this.isConnected = true;
      
      // 1. Initial Setup Message (Required by Gemini Live API)
      const setupMessage = {
        setup: {
          model: MODEL_NAME,
          generation_config: {
            response_modalities: ["AUDIO"],
          }
        }
      };
      
      this.socket?.send(JSON.stringify(setupMessage));

      // 3. Add a delay of 500ms before allowing audio transmission
      setTimeout(() => {
        console.log("Session ready for audio");
        this.canSendAudio = true;
      }, 500);
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // Handle incoming tool calls or audio chunks here
        this.handleMessage(data);
      } catch (e) {
        console.error("Error parsing message:", e);
      }
    };

    this.socket.onerror = (error) => {
      console.error("WebSocket Error:", error);
    };

    this.socket.onclose = (event) => {
      this.isConnected = false;
      this.canSendAudio = false;
      console.warn(`Live API Closed: ${event.reason || 'Unknown reason'}`);

      // 2. Reconnection logic (Exponential backoff or fixed 3s delay)
      if (!this.reconnectTimeout) {
        console.log("Attempting to reconnect in 3s...");
        this.reconnectTimeout = setTimeout(() => {
          this.reconnectTimeout = null;
          this.connect();
        }, 3000);
      }
    };
  }

  private handleMessage(data: any) {
    // Keep session alive - server sends 'setup_complete' or 'server_content'
    if (data.setupComplete) {
      console.log("Gemini Setup Complete");
    }
  }

  public sendAudio(base64Audio: string) {
    // 4. Ensure session stays alive and doesn't send data if not ready
    if (this.socket && this.isConnected && this.canSendAudio) {
      if (this.socket.readyState === WebSocket.OPEN) {
        const message = {
          realtime_input: {
            media_chunks: [
              {
                mime_type: "audio/pcm;rate=16000",
                data: base64Audio,
              },
            ],
          },
        };
        this.socket.send(JSON.stringify(message));
      } else {
        console.warn("WebSocket not ready. State:", this.socket.readyState);
      }
    }
  }

  public disconnect() {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.socket?.close();
  }
}

export const liveService = new LiveService();
