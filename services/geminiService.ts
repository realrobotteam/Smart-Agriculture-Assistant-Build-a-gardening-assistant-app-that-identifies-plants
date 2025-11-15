import { GoogleGenAI, Type, Chat } from "@google/genai";
import { PlantInfo } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // In a real app, you'd want to handle this more gracefully.
  // For this context, we assume the key is present.
  console.warn("API_KEY environment variable not set. App will not function correctly.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

const plantIdentifierModel = 'gemini-2.5-flash';
const chatModel = 'gemini-2.5-flash';
const videoAnalyzerModel = 'gemini-2.5-pro';

const plantCareSchema = {
  type: Type.OBJECT,
  properties: {
    plantName: { type: Type.STRING, description: "نام رایج گیاه." },
    scientificName: { type: Type.STRING, description: "نام علمی (لاتین) گیاه." },
    description: { type: Type.STRING, description: "توضیحی مختصر و جذاب درباره گیاه." },
    isPoisonous: { type: Type.BOOLEAN, description: "اگر گیاه برای حیوانات خانگی رایج (گربه، سگ) یا انسان‌ها سمی باشد true، در غیر این صورت false." },
    careInstructions: {
      type: Type.OBJECT,
      properties: {
        watering: { type: Type.STRING, description: "دستورالعمل‌های دقیق آبیاری، شامل دفعات و مقدار." },
        sunlight: { type: Type.STRING, description: "نیازهای نوری (مانند آفتاب کامل، سایه نسبی، نور غیر مستقیم)." },
        soil: { type: Type.STRING, description: "نوع خاک، pH و نیازهای زهکشی توصیه شده." },
        fertilizer: { type: Type.STRING, description: "برنامه کوددهی، نوع کود (مانند متعادل ۱۰-۱۰-۱۰) و توصیه‌های کاربرد." },
        pruning: { type: Type.STRING, description: "توصیه‌های هرس برای تشویق رشد یا حفظ شکل." },
      },
      required: ["watering", "sunlight", "soil", "fertilizer", "pruning"]
    },
    error: { type: Type.STRING, description: "یک پیام خطا در صورتی که گیاه قابل شناسایی نباشد." },
  },
  required: ["plantName", "scientificName", "description", "isPoisonous", "careInstructions"]
};


export const analyzePlantImage = async (base64Image: string, mimeType: string): Promise<PlantInfo> => {
  const imagePart = {
    inlineData: {
      data: base64Image,
      mimeType,
    },
  };
  const textPart = {
    text: "گیاه موجود در این تصویر را شناسایی کن. نام رایج و علمی آن، توضیحی مختصر، دستورالعمل‌های دقیق مراقبت برای آبیاری، نور خورشید، خاک، کود و هرس را ارائه بده. همچنین مشخص کن که آیا برای حیوانات خانگی یا انسان‌ها سمی است یا خیر. پاسخ را به زبان فارسی ارائه بده. اگر نمی‌توانی گیاه را شناسایی کنی، یک شیء با 'plantName' برابر با 'ناشناخته' و فیلد 'error' که دلیل آن را توضیح می‌دهد، برگردان.",
  };

  try {
    const response = await ai.models.generateContent({
      model: plantIdentifierModel,
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: plantCareSchema,
      }
    });
    
    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Error analyzing plant image:", error);
    throw new Error("تحلیل تصویر گیاه با مشکل مواجه شد. ممکن است مدل قادر به شناسایی این گیاه نباشد یا خطایی در API رخ داده باشد.");
  }
};

export const analyzePlantVideo = async (base64Video: string, mimeType: string): Promise<string> => {
  const videoPart = {
    inlineData: {
      data: base64Video,
      mimeType,
    },
  };
  const textPart = {
    text: "این ویدیوی یک گیاه را تحلیل کن. گیاه را شناسایی کن، وضعیت سلامت فعلی آن را توصیف کن و بر اساس آنچه می‌بینی، توصیه‌های دقیق مراقبتی ارائه بده. اگر علائمی از بیماری یا آفات وجود دارد، لطفاً آن‌ها را شناسایی کرده و راه‌های درمان را پیشنهاد بده. پاسخ را با استفاده از مارک‌داون و به زبان فارسی قالب‌بندی کن.",
  };

  try {
    const response = await ai.models.generateContent({
      model: videoAnalyzerModel,
      contents: { parts: [videoPart, textPart] },
    });
    
    return response.text;
  } catch (error) {
    console.error("Error analyzing plant video:", error);
    throw new Error("تحلیل ویدیوی گیاه با مشکل مواجه شد. ممکن است مدل قادر به پردازش این ویدیو نباشد یا خطایی در API رخ داده باشد.");
  }
};

export const createChat = (): Chat => {
    return ai.chats.create({
        model: chatModel,
        config: {
            systemInstruction: "شما فلورا، یک دستیار متخصص کشاورزی هستید. لحن شما دوستانه، دلگرم‌کننده و آگاهانه است. توصیه‌های مفید و مختصر در مورد همه چیزهای مربوط به کشاورزی ارائه دهید. پاسخ‌های خود را به زبان فارسی ارائه دهید و در صورت لزوم از مارک‌داون برای قالب‌بندی لیست‌ها یا تاکید استفاده کنید.",
        },
    });
}