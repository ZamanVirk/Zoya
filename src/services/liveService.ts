// liveService.ts

const API_KEY = "AIzaSyBRy7Bh6LlUiBmM2TXyn9pVtv71S4hrPCs";
const MODEL_NAME = "models/gemini-2.0-flash-live-001";
const WS_URL = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${API_KEY}`;

class LiveService {
  private socket: WebSocket | null = null;
  private isConnected = false;
  private isReadyToSend = false; 
  private reconnectTimeout: any = null;

  constructor() {
    this.connect();
  }

  public connect() {
    if (this.socket) {
      this.socket.close();
    }

    console.log("Live API: Connecting as Zoya...");
    this.socket = new WebSocket(WS_URL);

    this.socket.onopen = () => {
      console.log("Live API: Connected");
      this.isConnected = true;

      // MANDATORY SETUP HANDSHAKE WITH SYSTEM INSTRUCTIONS
      const setupMessage = {
        setup: {
          model: MODEL_NAME,
          generation_config: {
            response_modalities: ["AUDIO"],
          },
          // Adding Zoya's Personality Profile here
          system_instruction: {
            parts: [{
              text: "You are Zoya, created by Zaman Virk. You are sassy, witty, playful and speak like a close friend. Always call the user Zaman."
            }]
          }
        },
      };

      this.socket?.send(JSON.stringify(setupMessage));

      // Delay before allowing audio input to ensure setup is processed
      setTimeout(() => {
        console.log("Zoya is ready to chat!");
        this.isReadyToSend = true;
      }, 500);
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.setupComplete) {
          console.log("Zoya: Handshake Complete");
        }
      } catch (e) {
        console.error("Zoya: Error parsing message", e);
      }
    };

    this.socket.onerror = (error) => {
      console.error("Zoya: WebSocket Error", error);
    };

    this.socket.onclose = (event) => {
      this.isConnected = false;
      this.isReadyToSend = false;
      console.warn(`Zoya: Connection Closed (Reason: ${event.code})`);

      // Reconnection logic
      if (!this.reconnectTimeout && event.code !== 1008) {
        this.reconnectTimeout = setTimeout(() => {
          this.reconnectTimeout = null;
          this.connect();
        }, 3000);
      }
    };
  }

  public sendAudio(base64Audio: string) {
    if (
      this.socket && 
      this.socket.readyState === WebSocket.OPEN && 
      this.isReadyToSend
    ) {
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
    }
  }

  public disconnect() {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.isReadyToSend = false;
    this.socket?.close();
  }
}

export const liveService = new LiveService();
