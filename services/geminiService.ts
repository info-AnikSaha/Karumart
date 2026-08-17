import { GoogleGenAI } from "@google/genai";

// Initialize AI service lazily to ensure environment variables are loaded
let aiInstance: any = null;

const getApiKey = () => {
  // Try to find the key in multiple possible locations for Vite/Netlify compatibility
  const key = 
    (import.meta as any).env?.VITE_GEMINI_API_KEY || 
    process.env.GEMINI_API_KEY || 
    (window as any).process?.env?.GEMINI_API_KEY ||
    (window as any).VITE_GEMINI_API_KEY;
    
  return key && key !== 'undefined' && key !== 'null' ? key : null;
};

const getAI = () => {
  if (!aiInstance) {
    const apiKey = getApiKey();
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not defined or invalid. Please check your atmosphere/environment variables.");
    }
    aiInstance = new GoogleGenAI({ apiKey: apiKey || '' });
  }
  return aiInstance;
};

export const generateProductDescription = async (productName: string, category: string) => {
  const ai = getAI();
  const apiKey = getApiKey();
  if (!apiKey) {
    return "";
  }
  try {
    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: `Generate a short, attractive, and professional product description for a website in Bangla for the following product:
      Product Name: ${productName}
      Category: ${category}
      
      The description should highlight freshness, health benefits, and quality. Keep it within 2-3 sentences. Do not include price.
      
      IMPORTANT: Return ONLY the description text itself. Do not include any introductory remarks, markdown formatting (like code blocks), quotes at the beginning/end, or any extra explanation. Start directly with the Bangla description.`,
    });

    let text = response.text?.trim() || "";
    // Clean up potentially generated markdown or quotes
    text = text.replace(/^[`"']+|[`"']+$/g, '').replace(/```[\s\S]*?```/g, '').trim();

    return text;
  } catch (error) {
    console.error("Error generating description:", error);
    return "";
  }
};

export const chatWithSupport = async (
  history: { role: 'user' | 'model', parts: { text: string }[] }[], 
  userMessage: string,
  settings: { hotline: string, email: string } = { hotline: '+880123456789', email: 'support@karumart.com' },
  productContext: string = ""
) => {
  const ai = getAI();
  const apiKey = getApiKey();
  
  if (!apiKey) {
    throw new Error("API Key missing. Chat service is currently unavailable.");
  }

  try {
    const chat = ai.chats.create({
      model: "gemini-flash-latest",
      history: history,
      config: {
        systemInstruction: `You are a helpful customer support assistant for "Karumart" (কারুমার্ট), an e-commerce platform in Bangladesh. 
        Your goal is to help consumers, creators, and sellers with their questions. 
        Response in Bangla primarily, but use English terms where appropriate.
        Keep your answers polite, concise, and helpful.
        
        ${productContext ? `Here is the current product availability, price, and seller info:\n${productContext}\nUse this information to answer customer questions about specific items, who sells at the lowest price, or if something is in stock.` : ''}
        
        If you don't know the answer or the info is not in the context, ask them to contact our hotline at ${settings?.hotline || '+880123456789'} or email ${settings?.email || 'support@karumart.com'}.`,
      }
    });
    
    const result = await chat.sendMessage({
      message: userMessage
    });
    
    return result.text || "দুঃখিত, আমি আপনার অনুরোধটি বুঝতে পারছি না।";
  } catch (error: any) {
    console.error("Chat error:", error);
    throw error;
  }
};
