
import { GoogleGenAI, Type, Chat } from "@google/genai";
import { PlantInfo, ChatMessage, PlantDiseaseInfo, WeatherAlertsInfo, VideoAnalysisResult, CropCalendarResult } from '../types';

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
    variety: { type: Type.STRING, description: "نام واریته یا زیرگونه خاص گیاه در صورت امکان شناسایی (مثلاً 'گوجه فرنگی گیلاسی' یا 'انگور عسگری'). اگر قابل تشخیص نیست، این فیلد را خالی بگذار." },
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

const advancedDiagnosisSchema = {
  type: Type.OBJECT,
  properties: {
    diagnoses: {
      type: Type.ARRAY,
      description: "فهرستی از تمام مشکلات شناسایی شده (بیماری‌ها، آفات، کمبود مواد مغذی).",
      items: {
        type: Type.OBJECT,
        properties: {
          issueType: { type: Type.STRING, enum: ['بیماری', 'آفت', 'کمبود مواد مغذی'], description: "نوع مشکل." },
          issueName: { type: Type.STRING, description: "نام مشکل شناسایی شده." },
          description: { type: Type.STRING, description: "شرح علائم و تأثیرات مشکل." },
          severity: {
            type: Type.OBJECT,
            properties: {
              level: { type: Type.STRING, enum: ['کم', 'متوسط', 'زیاد', 'بحرانی'], description: "سطح شدت." },
              percentage: { type: Type.NUMBER, description: "درصد تخمینی درگیری گیاه (0-100)." }
            },
            required: ["level", "percentage"]
          },
          possibleCauses: { type: Type.ARRAY, items: { type: Type.STRING }, description: "فهرست دلایل احتمالی." },
          treatment: {
            type: Type.OBJECT,
            properties: {
              organic: { type: Type.ARRAY, items: { type: Type.STRING }, description: "روش‌های درمانی ارگانیک." },
              chemical: {
                type: Type.ARRAY,
                description: "روش‌های درمانی شیمیایی.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING, description: "نام سم یا ماده شیمیایی." },
                    chemicalGroup: { type: Type.STRING, description: "گروه شیمیایی سم برای مدیریت مقاومت." },
                    instructions: { type: Type.STRING, description: "دستورالعمل مصرف." }
                  },
                  required: ["name", "chemicalGroup", "instructions"]
                }
              },
              resistanceManagementNote: { type: Type.STRING, description: "توصیه مهم برای مدیریت مقاومت به سموم، شامل چرخش بین گروه‌های شیمیایی مختلف." }
            },
            required: ["organic", "chemical", "resistanceManagementNote"]
          },
          prevention: { type: Type.ARRAY, items: { type: Type.STRING }, description: "نکات پیشگیرانه." }
        },
        required: ["issueType", "issueName", "description", "severity", "possibleCauses", "treatment", "prevention"]
      }
    },
    overallHealthSummary: { type: Type.STRING, description: "یک خلاصه کلی از وضعیت سلامت گیاه." },
    error: { type: Type.STRING, description: "پیام خطا در صورتی که هیچ مشکلی قابل تشخیص نباشد." }
  },
  required: ["diagnoses", "overallHealthSummary"]
};

const weatherAlertsSchema = {
  type: Type.OBJECT,
  properties: {
    locationName: { type: Type.STRING, description: "نام شهر یا منطقه مرتبط با مختصات جغرافیایی." },
    overallSummary: { type: Type.STRING, description: "خلاصه‌ای از وضعیت آب‌وهوا و تأثیر کلی آن بر گیاهان." },
    alerts: {
      type: Type.ARRAY,
      description: "فهرستی از هشدارهای بیماری‌های احتمالی.",
      items: {
        type: Type.OBJECT,
        properties: {
          riskLevel: { type: Type.STRING, enum: ['کم', 'متوسط', 'زیاد'], description: "سطح خطر شیوع بیماری." },
          diseaseName: { type: Type.STRING, description: "نام بیماری گیاهی که خطر آن وجود دارد." },
          reason: { type: Type.STRING, description: "دلیل آب‌وهوایی برای این هشدار (مثلاً رطوبت بالا)." },
          preventativeAction: { type: Type.STRING, description: "اقدام پیشگیرانه پیشنهادی." }
        },
        required: ["riskLevel", "diseaseName", "reason", "preventativeAction"]
      }
    },
    error: { type: Type.STRING, description: "پیام خطا در صورت عدم امکان دریافت اطلاعات." }
  },
  required: ["locationName", "overallSummary", "alerts"]
};

const videoAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        overallSummary: { type: Type.STRING, description: "یک خلاصه کلی از وضعیت سلامت کل مزرعه/ردیف نمایش داده شده در ویدیو." },
        plantingDensity: {
            type: Type.OBJECT,
            properties: {
                status: { type: Type.STRING, enum: ['بهینه', 'متراکم', 'کم‌پشت'], description: "وضعیت تراکم کاشت." },
                recommendation: { type: Type.STRING, description: "توصیه عملی، مثلاً نیاز به تنک کردن." }
            },
            required: ["status", "recommendation"]
        },
        sections: {
            type: Type.ARRAY,
            description: "فهرستی از بخش‌های زمانی تحلیل شده در ویدیو.",
            items: {
                type: Type.OBJECT,
                properties: {
                    startTime: { type: Type.NUMBER, description: "زمان شروع بخش (به ثانیه)." },
                    endTime: { type: Type.NUMBER, description: "زمان پایان بخش (به ثانیه)." },
                    status: { type: Type.STRING, enum: ['سالم', 'مشکوک', 'بیمار'], description: "وضعیت سلامت در این بخش." },
                    description: { type: Type.STRING, description: "شرح دقیق مشاهدات در این بخش." },
                    issues: { type: Type.ARRAY, items: { type: Type.STRING }, description: "فهرست مشکلات خاص شناسایی شده در این بخش (بیماری، آفت، و غیره)." }
                },
                required: ["startTime", "endTime", "status", "description", "issues"]
            }
        },
        error: { type: Type.STRING, description: "پیام خطا در صورت عدم امکان تحلیل ویدیو." }
    },
    required: ["overallSummary", "plantingDensity", "sections"]
};

const cropCalendarSchema = {
    type: Type.OBJECT,
    properties: {
        cropName: { type: Type.STRING, description: "نام محصول وارد شده توسط کاربر." },
        locationName: { type: Type.STRING, description: "نام منطقه جغرافیایی." },
        plantingDate: { type: Type.STRING, description: "تاریخ کاشت وارد شده توسط کاربر." },
        schedule: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    week: { type: Type.NUMBER, description: "شماره هفته از زمان کاشت." },
                    dateRange: { type: Type.STRING, description: "بازه تاریخی برای آن هفته." },
                    stage: { type: Type.STRING, description: "مرحله رشد گیاه در آن هفته." },
                    tasks: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                taskType: { type: Type.STRING, enum: ['کوددهی', 'آبیاری', 'سم‌پاشی', 'هرس', 'بازرسی', 'برداشت', 'سایر'], description: "نوع وظیفه." },
                                description: { type: Type.STRING, description: "شرح دقیق وظیفه." }
                            },
                            required: ["taskType", "description"]
                        }
                    }
                },
                required: ["week", "dateRange", "stage", "tasks"]
            }
        },
        error: { type: Type.STRING, description: "پیام خطا در صورت عدم امکان ایجاد تقویم." }
    },
    required: ["cropName", "locationName", "plantingDate", "schedule"]
};


export const analyzePlantImage = async (base64Image: string, mimeType: string): Promise<PlantInfo> => {
  const imagePart = {
    inlineData: {
      data: base64Image,
      mimeType,
    },
  };
  const textPart = {
    text: "گیاه موجود در این تصویر را شناسایی کن. نام رایج و علمی آن، و در صورت امکان واریته یا زیرگونه خاص آن (مثلاً 'گوجه فرنگی گیلاسی') را مشخص کن. توضیحی مختصر، دستورالعمل‌های دقیق مراقبت برای آبیاری، نور خورشید، خاک، کود و هرس را ارائه بده. همچنین مشخص کن که آیا برای حیوانات خانگی یا انسان‌ها سمی است یا خیر. پاسخ را به زبان فارسی ارائه بده. اگر نمی‌توانی گیاه را شناسایی کنی، یک شیء با 'plantName' برابر با 'ناشناخته' و فیلد 'error' که دلیل آن را توضیح می‌دهد، برگردان.",
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

export const diagnosePlantDisease = async (base64Image: string, mimeType: string): Promise<PlantDiseaseInfo> => {
  const imagePart = {
    inlineData: {
      data: base64Image,
      mimeType,
    },
  };
  const textPart = {
    text: "گیاه در تصویر را تحلیل کن. تمام مشکلات (بیماری، آفت، کمبود مواد مغذی) را شناسایی کن. برای هر مشکل: نوع، نام، شرح، شدت (کم/متوسط/زیاد/بحرانی) با درصد، دلایل، و پیشگیری را ارائه بده. برای بخش درمان: گزینه‌های ارگانیک را لیست کن. برای درمان شیمیایی، سموم رایج در ایران/خاورمیانه را پیشنهاد بده و برای هر کدام نام، گروه شیمیایی، و دستورالعمل مصرف را ذکر کن. یک نکته مهم و واضح در مورد مدیریت مقاومت از طریق چرخش گروه‌های شیمیایی مختلف ارائه بده. در آخر، یک خلاصه کلی از سلامت گیاه بنویس. پاسخ باید به زبان فارسی و مطابق اسکیمای JSON باشد.",
  };

  try {
    const response = await ai.models.generateContent({
      model: plantIdentifierModel,
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: advancedDiagnosisSchema,
      }
    });
    
    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Error diagnosing plant disease:", error);
    throw new Error("تحلیل تصویر برای تشخیص بیماری با مشکل مواجه شد. لطفاً دوباره تلاش کنید.");
  }
};

export const analyzePlantVideo = async (base64Video: string, mimeType: string): Promise<VideoAnalysisResult> => {
  const videoPart = {
    inlineData: {
      data: base64Video,
      mimeType,
    },
  };
  const textPart = {
    text: `شما یک متخصص کشاورزی هستید که در حال بازرسی یک مزرعه از طریق ویدیو هستید. این ویدیو را به دقت تحلیل کنید. وظایف شما عبارتند از:
۱. **تحلیل بخش به بخش**: ویدیو را به بخش‌های زمانی معنادار تقسیم کنید. برای هر بخش، وضعیت سلامت (مثلاً 'سالم'، 'مشکوک'، 'بیمار')، شرح دقیق مشاهدات، و فهرستی از مشکلات شناسایی شده (مانند بیماری‌ها، آفات، تنش آبی) را ارائه دهید.
۲. **تحلیل تراکم کاشت**: تراکم کاشت گیاهان را ارزیابی کنید و وضعیت آن را (مثلاً 'بهینه'، 'متراکم'، 'کم‌پشت') مشخص کنید. بر اساس ارزیابی، یک توصیه عملی (مانند نیاز به تنک کردن) ارائه دهید.
۳. **خلاصه کلی**: یک خلاصه کلی از وضعیت سلامت کل مزرعه/ردیف نمایش داده شده در ویدیو ارائه دهید.
پاسخ را به زبان فارسی و در قالب JSON مطابق با اسکیمای ارائه شده برگردان.`,
  };

  try {
    const response = await ai.models.generateContent({
      model: videoAnalyzerModel,
      contents: { parts: [videoPart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: videoAnalysisSchema,
      }
    });
    
    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Error analyzing plant video:", error);
    throw new Error("تحلیل ویدیوی گیاه با مشکل مواجه شد. ممکن است مدل قادر به پردازش این ویدیو نباشد یا خطایی در API رخ داده باشد.");
  }
};

export const getWeatherBasedAlerts = async (latitude: number, longitude: number): Promise<WeatherAlertsInfo> => {
  try {
    const response = await ai.models.generateContent({
      model: plantIdentifierModel,
      contents: `با استفاده از جستجوی وب برای دریافت اطلاعات آب‌وهوای فعلی و پیش‌بینی ۵ روز آینده برای موقعیت جغرافیایی با عرض ${latitude} و طول ${longitude}، خطرات احتمالی شیوع بیماری‌های رایج گیاهان باغی (مانند سفیدک پودری، لکه سیاه، زنگ گیاهی) را تحلیل کن. پاسخ باید شامل نام مکان، یک خلاصه کلی، و فهرستی از هشدارهای خاص باشد. هر هشدار باید شامل سطح خطر (کم، متوسط، زیاد)، نام بیماری، دلیل آب‌وهوایی، و یک اقدام پیشگیرانه پیشنهادی باشد. پاسخ را به زبان فارسی و در قالب JSON ارائه بده.`,
      config: {
        tools: [{googleSearch: {}}],
        responseMimeType: "application/json",
        responseSchema: weatherAlertsSchema,
      },
    });
    
    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Error getting weather-based alerts:", error);
    throw new Error("دریافت هشدارهای آب‌وهوایی با مشکل مواجه شد. لطفاً از فعال بودن موقعیت مکانی خود اطمینان حاصل کرده و دوباره تلاش کنید.");
  }
};

export const generateCropCalendar = async (crop: string, plantingDate: string, latitude: number, longitude: number): Promise<CropCalendarResult> => {
  try {
    const response = await ai.models.generateContent({
      model: plantIdentifierModel,
      contents: `یک تقویم زراعی دقیق برای محصول '${crop}' که در تاریخ '${plantingDate}' در منطقه جغرافیایی با عرض ${latitude} و طول ${longitude} کاشته شده است، ایجاد کن. از جستجوی وب برای درک اقلیم و فصل رشد معمول این منطقه استفاده کن. تقویم باید شامل برنامه‌ زمانی وظایف کلیدی مانند کوددهی، آبیاری، سم‌پاشی پیشگیرانه، هرس، و برداشت باشد که بر اساس هفته از زمان کاشت تقسیم‌بندی شده است. برای هر دوره، مرحله رشد گیاه را مشخص کن. خروجی را به زبان فارسی و در قالب JSON ارائه بده.`,
      config: {
        tools: [{googleSearch: {}}],
        responseMimeType: "application/json",
        responseSchema: cropCalendarSchema,
      },
    });
    
    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Error generating crop calendar:", error);
    throw new Error("ایجاد تقویم زراعی با مشکل مواجه شد. لطفاً ورودی‌های خود را بررسی کرده و دوباره تلاش کنید.");
  }
};

export const evaluateTreatmentEffectiveness = async (
  base64ImageBefore: string, mimeTypeBefore: string,
  base64ImageAfter: string, mimeTypeAfter: string,
  originalDiagnosis: string
): Promise<string> => {
  const imagePartBefore = { inlineData: { data: base64ImageBefore.split(',')[1], mimeType: mimeTypeBefore } };
  const imagePartAfter = { inlineData: { data: base64ImageAfter.split(',')[1], mimeType: mimeTypeAfter } };
  const textPart = {
    text: `شما یک متخصص کشاورزی هستید. یک گیاه با تشخیص اولیه '${originalDiagnosis}' تحت درمان قرار گرفته است. تصویر اول گیاه را در زمان تشخیص نشان می‌دهد و تصویر دوم همان گیاه را پس از درمان نشان می‌دهد. این دو تصویر را مقایسه کنید و اثربخشی درمان را ارزیابی کنید. آیا وضعیت گیاه بهبود یافته، ثابت مانده یا بدتر شده است؟ یک تحلیل کوتاه و واضح به زبان فارسی ارائه دهید و در صورت لزوم، توصیه‌های بیشتری ارائه کنید.`,
  };

  try {
    const response = await ai.models.generateContent({
      model: plantIdentifierModel,
      contents: { parts: [imagePartBefore, textPart, imagePartAfter] },
    });
    return response.text.trim();
  } catch (error) {
    console.error("Error evaluating treatment effectiveness:", error);
    throw new Error("ارزیابی اثربخشی درمان با مشکل مواجه شد. لطفاً دوباره تلاش کنید.");
  }
};

export const generateChatTitle = async (firstMessage: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: chatModel,
      contents: `بر اساس این پرسش کاربر، یک عنوان کوتاه و توصیفی برای این جلسه چت ایجاد کن (حداکثر ۵ کلمه). پرسش: "${firstMessage}". فقط عنوان را برگردان.`,
    });
    return response.text.trim().replace(/"/g, ''); // Clean up quotes
  } catch (error) {
    console.error("Error generating chat title:", error);
    // Fallback to a simpler title
    return firstMessage.substring(0, 30) + '...';
  }
};

export const createChat = (history?: ChatMessage[]): Chat => {
    return ai.chats.create({
        model: chatModel,
        history: history,
        config: {
            systemInstruction: "شما فلورا، یک دستیار متخصص کشاورزی هستید. لحن شما دوستانه، دلگرم‌کننده و آگاهانه است. توصیه‌های مفید و مختصر در مورد همه چیزهای مربوط به کشاورزی ارائه دهید. پاسخ‌های خود را به زبان فارسی ارائه دهید و در صورت لزوم از مارک‌داون برای قالب‌ بندی لیست‌ها یا تاکید استفاده کنید.",
        },
    });
}