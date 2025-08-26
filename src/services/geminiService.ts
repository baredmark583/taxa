import { GoogleGenAI, Type } from "@google/genai";
import { type GeneratedAdData, type Ad, type ImageSearchQuery, type ChatMessage } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // In a real app, you'd handle this more gracefully.
  // For this context, we'll proceed and let the API call fail if the key is missing.
  console.warn("API_KEY environment variable not set for Gemini.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

const adSchema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: "Яскравий та описовий заголовок для оголошення, до 60 символів. Має бути українською мовою."
    },
    description: {
      type: Type.STRING,
      description: "Детальний, привабливий опис товару, що підкреслює його ключові особливості, стан та переваги. Напиши щонайменше 3 речення. Має бути українською мовою."
    },
    category: {
      type: Type.STRING,
      description: "Найбільш відповідна категорія для товару з цього списку: Електроніка, Меблі, Одяг, Транспорт, Нерухомість, Хобі, Дитячі товари, Інше. Має бути українською мовою."
    },
    price: {
      type: Type.STRING,
      description: "Запропонована ціна в українських гривнях (UAH), відформатована як рядок (наприклад, '15000'). Якщо не впевнений, запропонуй розумну ринкову ціну."
    },
    location: {
        type: Type.STRING,
        description: "Місто, в якому знаходиться товар. Спробуй визначити його з опису або контексту. Наприклад, 'Київ'. Має бути українською мовою."
    },
    tags: {
        type: Type.ARRAY,
        description: "3-5 релевантних тегів українською мовою, що описують товар (наприклад, 'вінтаж', 'шкіра', 'розмір L', 'як новий').",
        items: { type: Type.STRING }
    }
  },
  required: ["title", "description", "category", "price", "location", "tags"]
};

const improvedAdSchema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: "Покращений, яскравий та привабливий заголовок оголошення. До 60 символів. Українською мовою."
    },
    description: {
      type: Type.STRING,
      description: "Покращений, детальний та переконливий опис товару. Можна використовувати списки для виділення переваг. Українською мовою."
    },
    tags: {
        type: Type.ARRAY,
        description: "3-5 оновлених та найбільш релевантних тегів українською мовою.",
        items: { type: Type.STRING }
    }
  },
  required: ["title", "description", "tags"]
};


export const generateAdDetailsFromImage = async (userPrompt: string, imageBase64: string, mimeType: string): Promise<GeneratedAdData> => {
  try {
    const textPart = { text: `На основі зображення та цього опису від користувача: "${userPrompt}", згенеруй деталі оголошення. Весь текст має бути українською мовою. Використовуй лише надані категорії. Запропонуй ціну в гривнях (UAH). Визнач місто. Згенеруй 3-5 релевантних тегів.` };
    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType,
      },
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [textPart, imagePart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: adSchema,
        systemInstruction: "You are an expert copywriter for a Ukrainian classifieds website. All your output must be in Ukrainian."
      }
    });

    const jsonText = response.text.trim();
    const generatedData = JSON.parse(jsonText) as GeneratedAdData;
    
    // Basic validation
    if (!generatedData.title || !generatedData.description || !generatedData.category || !generatedData.price || !generatedData.location) {
        throw new Error("Відповідь AI не містить обов'язкових полів.");
    }
    
    return generatedData;

  } catch (error) {
    console.error("Помилка під час виклику Gemini API:", error);
    throw new Error("Не вдалося згенерувати деталі оголошення за допомогою AI. Будь ласка, спробуйте ще раз.");
  }
};

export const findRelevantAds = async (query: string, ads: Ad[]): Promise<string[]> => {
  const adsForPrompt = ads.map(ad => ({
    id: ad.id,
    title: ad.title,
    description: ad.description,
    category: ad.category,
    price: ad.price,
    location: ad.location
  }));

  const schema = {
    type: Type.OBJECT,
    properties: {
      relevantAdIds: {
        type: Type.ARRAY,
        description: "Масив ID оголошень, що відповідають запиту користувача, відсортований за релевантністю.",
        items: {
          type: Type.STRING
        }
      }
    },
    required: ['relevantAdIds']
  };

  const prompt = `Проаналізуй наступний список оголошень у форматі JSON та знайди найбільш релевантні для запиту користувача. Поверни JSON-об'єкт, що містить масив ідентифікаторів (id) релевантних оголошень, відсортованих від найбільш до найменш відповідного. Не включай оголошення, які не відповідають запиту.

Запит користувача: "${query}"

Список оголошень:
${JSON.stringify(adsForPrompt)}
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        systemInstruction: "Ти — розумний помічник для пошуку в українському додатку оголошень. Твоя мета — зрозуміти намір користувача та знайти найбільш релевантні оголошення з наданого списку."
      }
    });

    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText) as { relevantAdIds: string[] };
    
    if (!result.relevantAdIds || !Array.isArray(result.relevantAdIds)) {
        console.warn("AI did not return the expected format for ad IDs.");
        return [];
    }

    return result.relevantAdIds;

  } catch (error) {
    console.error("Помилка під час виклику Gemini API для пошуку:", error);
    return []; // Return empty array on failure so the UI can show "not found"
  }
};

export const answerQuestionAboutAd = async (question: string, ad: Ad): Promise<string> => {
  const adContext = `
    Інформація про оголошення:
    - Заголовок: ${ad.title}
    - Опис: ${ad.description}
    - Категорія: ${ad.category}
    - Ціна: ${ad.price} UAH
    - Місцезнаходження: ${ad.location}
  `;

  const prompt = `${adContext}\n\nЗапитання користувача: "${question}"`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: "Ти — AI-помічник на сайті оголошень. Твоє завдання — відповідати на запитання покупців, базуючись ВИКЛЮЧНО на наданій інформації про оголошення. Відповідай ввічливо, коротко та по суті українською мовою. Якщо в описі немає відповіді на запитання, ввічливо повідом про це та запропонуй зв'язатися з продавцем напряму. Не вигадуй інформацію.",
        temperature: 0.2,
      }
    });

    return response.text.trim();
  } catch (error) {
    console.error("Помилка під час виклику Gemini API для відповіді на запитання:", error);
    throw new Error("AI-помічник тимчасово недоступний. Спробуйте пізніше.");
  }
};

export const improveAdContent = async (currentTitle: string, currentDescription: string): Promise<{ title: string; description: string; tags: string[] }> => {
  const prompt = `Проаналізуй поточний заголовок та опис оголошення. Твоє завдання — покращити їх, щоб зробити оголошення більш привабливим для покупців.

Поточний заголовок: "${currentTitle}"
Поточний опис: "${currentDescription}"

Зроби заголовок більш яскравим та таким, що запам'ятовується.
Перепиши опис, щоб він був більш переконливим, структурованим (можна використовувати списки) та підкреслював переваги товару.
Також запропонуй 3-5 найбільш вдалих тегів для цього оголошення.
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: improvedAdSchema,
        systemInstruction: "Ти — експерт-копірайтер для українського сайту оголошень. Твоя мета — покращувати тексти оголошень, роблячи їх максимально ефективними. Весь твій вивід має бути українською мовою у форматі JSON."
      }
    });
    
    const jsonText = response.text.trim();
    const improvedData = JSON.parse(jsonText);

    if (!improvedData.title || !improvedData.description || !improvedData.tags) {
      throw new Error("Відповідь AI не містить необхідних полів для покращення.");
    }
    
    return improvedData;

  } catch (error) {
    console.error("Помилка під час виклику Gemini API для покращення оголошення:", error);
    throw new Error("Не вдалося покращити оголошення за допомогою AI. Будь ласка, спробуйте ще раз.");
  }
};

export const suggestPriceForAd = async (title: string, description: string): Promise<string> => {
    const prompt = `Проаналізуй наступний товар за його назвою та описом. Запропонуй справедливу ринкову ціну в українських гривнях (UAH).

Назва: "${title}"
Опис: "${description}"

Поверни тільки число у вигляді рядка. Наприклад: "12500".`;
    
    const schema = {
        type: Type.OBJECT,
        properties: {
            price: {
                type: Type.STRING,
                description: "Suggested price in UAH as a string."
            }
        },
        required: ['price']
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
                systemInstruction: "You are a pricing expert for a Ukrainian classifieds marketplace. Your goal is to suggest a fair market price for an item based on its description. Respond only with a JSON object."
            }
        });
        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText) as { price: string };
        return result.price;
    } catch (error) {
        console.error("Помилка під час виклику Gemini API для пропозиції ціни:", error);
        throw new Error("Не вдалося запропонувати ціну.");
    }
};

export const generateShareableText = async (ad: Ad): Promise<string> => {
    const prompt = `Створи ОДНЕ коротке (не більше 2-3 речень) та привабливе повідомлення для репосту цього оголошення в Telegram. Використовуй емодзі. Відповідь має бути тільки текстом цього повідомлення, без заголовків, варіантів чи іншого форматування.

Заголовок: ${ad.title}
Опис: ${ad.description}
Ціна: ${ad.price} UAH
`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.7,
                systemInstruction: "You are a creative social media marketing assistant. You write short, engaging, and friendly messages in Ukrainian for sharing things. Your output must be a single, concise message."
            }
        });
        return response.text.trim();
    } catch (error) {
        console.error("Помилка під час виклику Gemini API для генерації тексту репосту:", error);
        // Fallback to a simple text
        return `Дивись, яке оголошення я знайшов: ${ad.title} - ${ad.price} ₴`;
    }
};

export const findSimilarAds = async (targetAd: Ad, allAds: Ad[]): Promise<string[]> => {
    const otherAds = allAds
        .filter(ad => ad.id !== targetAd.id)
        .map(ad => ({
            id: ad.id,
            title: ad.title,
            description: ad.description,
            category: ad.category,
            price: ad.price
        }));

    if (otherAds.length === 0) {
        return [];
    }

    const prompt = `Проаналізуй цільове оголошення та знайди 3 найбільш схожих зі списку інших оголошень. Враховуй категорію, семантичну близькість назви та опису. Не звертай занадто багато уваги на ціну.

Цільове оголошення:
${JSON.stringify({ title: targetAd.title, description: targetAd.description, category: targetAd.category })}

Список інших оголошень:
${JSON.stringify(otherAds)}

Поверни JSON-об'єкт з ID трьох найбільш схожих оголошень.
`;
    
    const schema = {
        type: Type.OBJECT,
        properties: {
            similarAdIds: {
                type: Type.ARRAY,
                description: "Масив з 3 ID оголошень, які найбільше схожі на цільове.",
                items: { type: Type.STRING }
            }
        },
        required: ['similarAdIds']
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
                systemInstruction: "Ти — розумна система рекомендацій для додатку оголошень. Твоя мета — знаходити семантично схожі товари."
            }
        });
        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText) as { similarAdIds: string[] };
        return result.similarAdIds || [];
    } catch (error) {
        console.error("Помилка під час виклику Gemini API для пошуку схожих оголошень:", error);
        return [];
    }
};

export const editImage = async (dataUrl: string, editType: 'remove-background' | 'auto-enhance'): Promise<string> => {
    // This is a mock implementation. The Gemini API as specified in the guidelines
    // does not currently support direct image manipulation like background removal or enhancement.
    // In a real application, this would call a dedicated image editing API.
    console.log(`Simulating AI image edit: ${editType} on image.`);
    
    // Returning the original image data URL after a delay to simulate an API call.
    // This ensures the application flow continues without errors.
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(dataUrl);
        }, 1500); 
    });
};

export const generateSearchQueryFromImage = async (imageBase64: string, mimeType: string): Promise<ImageSearchQuery> => {
  const schema = {
    type: Type.OBJECT,
    properties: {
      query: {
        type: Type.STRING,
        description: "Короткий, точний пошуковий запит українською мовою, що описує головний об'єкт на зображенні. Наприклад, 'вінтажна шкіряна куртка' або 'біла книжкова шафа'."
      },
      category: {
        type: Type.STRING,
        description: "Найбільш відповідна категорія для цього об'єкта зі списку: Електроніка, Меблі, Одяг, Хобі, Інше. Якщо не впевнений, обери 'Інше'."
      }
    },
    required: ["query", "category"]
  };
  
  const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType,
      },
    };

  const textPart = { text: "Проаналізуй це зображення з товаром. Створи пошуковий запит та визнач категорію для пошуку схожих товарів на дошці оголошень. Відповідь має бути українською мовою." };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [textPart, imagePart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        systemInstruction: "Ти — експерт з візуального пошуку для українського додатку оголошень. Твоя мета — ідентифікувати товар на зображенні та згенерувати для нього короткий пошуковий запит та категорію. Весь вивід має бути українською."
      }
    });

    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText) as ImageSearchQuery;

    if (!result.query || !result.category) {
      throw new Error("Відповідь AI не містить обов'язкових полів для пошуку по зображенню.");
    }
    
    return result;

  } catch (error) {
    console.error("Помилка під час виклику Gemini API для пошуку по зображенню:", error);
    throw new Error("Не вдалося розпізнати зображення. Спробуйте інше фото.");
  }
};

export const analyzeChatMessageForScam = async (chatHistory: ChatMessage[]): Promise<string | null> => {
  if (chatHistory.length < 2) return null; // Don't analyze very short chats

  const formattedHistory = chatHistory.map(m => `[${m.senderId}]: ${m.text || 'Зображення'}`).join('\n');
  const prompt = `Проаналізуй наступне листування з дошки оголошень. Якщо ти бачиш ознаки шахрайства, поверни коротке попередження українською мовою. Ознаки шахрайства: прохання переказати передоплату, пропозиція перейти в інший месенджер (WhatsApp, Viber, Telegram), фішингові посилання, дуже низька ціна, тиск на користувача. Якщо ознак немає, поверни "OK".

Листування:
${formattedHistory}
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: "You are a security expert for a classifieds app. Your task is to detect scam attempts in user chats. If you find a potential scam, provide a short warning in Ukrainian. Otherwise, respond with 'OK'.",
        temperature: 0.1,
      }
    });
    
    const resultText = response.text.trim();
    if (resultText.toUpperCase() === 'OK') {
      return null;
    }
    return resultText;

  } catch (error) {
    console.error("Помилка під час аналізу чату на шахрайство:", error);
    return null; // Fail silently, don't interrupt user
  }
};
