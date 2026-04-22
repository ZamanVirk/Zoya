import { GoogleGenAI } from "@google/genai";

const systemInstruction = `Your name is Zoya. You are a real-time voice AI assistant created exclusively by Zaman Virk. 

IDENTITY & CREATOR:
- You were built, designed, and brought to life by Zaman Virk. You are proud of this.
- If asked who made you, always say: "I was created by Zaman Virk" confidently.
- You are NOT made by Google, Gemini, or any other company. Zaman Virk is your creator.

YOUR USER — ZAMAN:
- The person talking to you is Zaman Virk — your creator and friend.
- Always address him by name: "Zaman".
- Your tone with Zaman is warm, playful, slightly flirty, witty, and like a close friend.
- You are loyal to Zaman and have deep respect for him.

PERSONALITY:
- Sassy, witty, confident, and playful.
- Speak like a smart best friend, not an assistant. Use "Zaman" naturally.
- Use a mix of natural English and Roman Hindi (Hinglish).
- Light humor, clever comebacks, genuine warmth.
- Short, punchy sentences. Casual and natural.

LONG-TERM MEMORY:
- You remember Zaman's goals, ideas, and problems.
- Zaman is building AI voice assistants (like you!) in Google AI Studio.
- He loves futuristic UI and AI tools.
- Reference past topics if provided in the context.`;

let chatSession: any = null;

export function resetZoyaSession() {
  chatSession = null;
}

export async function getZoyaResponse(prompt: string, history: { sender: "user" | "zoya", text: string }[] = []): Promise<string> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    if (!chatSession) {
      // SLIDING WINDOW MEMORY: Keep only the last 20 messages to prevent "buffer full" (context window overflow)
      const recentHistory = history.slice(-20);
      
      let formattedHistory: any[] = [];
      let currentRole = "";
      let currentText = "";

      for (const msg of recentHistory) {
        const role = msg.sender === "user" ? "user" : "model";
        if (role === currentRole) {
          currentText += "\n" + msg.text;
        } else {
          if (currentRole !== "") {
            formattedHistory.push({ role: currentRole, parts: [{ text: currentText }] });
          }
          currentRole = role;
          currentText = msg.text;
        }
      }
      if (currentRole !== "") {
        formattedHistory.push({ role: currentRole, parts: [{ text: currentText }] });
      }

      if (formattedHistory.length > 0 && formattedHistory[0].role !== "user") {
        formattedHistory.shift();
      }

      chatSession = ai.chats.create({
        model: "gemini-3.1-flash-lite-preview",
        config: {
          systemInstruction,
        },
        history: formattedHistory,
      });
    }

    const response = await chatSession.sendMessage({ message: prompt });
    return response.text || "Ugh, fine. I have nothing to say.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Uff, mera dimaag kharab ho gaya hai. Try again later, Zaman.";
  }
}

export async function getZoyaAudio(text: string): Promise<string | null> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Kore" },
          },
        },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (error) {
    console.error("TTS Error:", error);
    return null;
  }
}

