// liveService.ts
import { GoogleGenAI } from "@google/genai";

const API_KEY = "AIzaSyCgNs7cRDtx9t5drtPABnnkroWNO1AEQcw";

class LiveService {
  private client = new GoogleGenAI({ apiKey: API_KEY });
  private session: any = null;
  private audioContext: AudioContext | null = null;
  private isConnected = false;

  public async connect() {
    if (this.isConnected) return;

    try {
      console.log("Zoya: Connecting...");
      
      // Using the @google/genai SDK live connection
      this.session = await this.client.live.connect({
        model: "gemini-2.0-flash-live-001",
        config: {
          systemInstruction: {
            parts: [{ 
              text: "You are Zoya, created by Zaman Virk. You are sassy, witty, playful and speak like a close friend. Always call the user Zaman." 
            }]
          },
          generationConfig: {
            responseModalities: ["audio"]
          }
        }
      });

      this.isConnected = true;

      // Setup Listeners
      this.setupListeners();
      
    } catch (error) {
      console.error("Zoya: Connection Error", error);
      this.isConnected = false;
    }
  }

  private setupListeners() {
    if (!this.session) return;

    // The SDK uses a for-await loop or event listeners depending on version
    // Standard event-based handling for the live session:
    this.session.on("open", () => console.log("Zoya: Session Opened"));
    
    this.session.on("message", (msg: any) => {
      // Handle audio content from Zoya
      const parts = msg.serverContent?.modelTurn?.parts;
      if (parts) {
        parts.forEach((part: any) => {
          if (part.inlineData?.data) {
            this.playAudio(part.inlineData.data);
          }
        });
      }

      if (msg.setupComplete) {
        console.log("Zoya: Handshake Complete");
      }
    });

    this.session.on("error", (err: any) => {
      console.error("Zoya: Live API Error", err);
    });

    this.session.on("close", () => {
      console.log("Zoya: Connection Closed");
      this.isConnected = false;
    });
  }

  private async playAudio(base64: string) {
    try {
      if (!this.audioContext) {
        this.audioContext = new AudioContext({ sampleRate: 24000 });
      }

      // Convert base64 to ArrayBuffer
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Decode and play
      const audioBuffer = await this.audioContext.decodeAudioData(bytes.buffer);
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      source.start();
    } catch (e) {
      console.error("Zoya: Audio Playback Error", e);
    }
  }

  public sendAudio(base64Audio: string) {
    if (this.session && this.isConnected) {
      try {
        // Send audio chunk to Zoya
        this.session.send({
          realtimeInput: {
            mediaChunks: [{
              mimeType: "audio/pcm;rate=16000",
              data: base64Audio
            }]
          }
        });
      } catch (error) {
        console.error("Zoya: Failed to send audio", error);
      }
    }
  }

  public disconnect() {
    if (this.session) {
      this.session.close();
      this.session = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.isConnected = false;
    console.log("Zoya: Disconnected");
  }
}

export const liveService = new LiveService();
