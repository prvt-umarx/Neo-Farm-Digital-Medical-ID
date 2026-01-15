
import { GoogleGenAI } from "@google/genai";
import { UserProfile, Language } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getPatientSummary(profile: UserProfile, lang: Language): Promise<string> {
  const prompt = `
    Analyze the following patient medical profile and provide a brief, professional clinical summary.
    Focus on key diagnoses, recurring issues, and critical allergies.
    The response should be in ${lang === Language.RU ? 'Russian' : 'Uzbek'}.
    
    Patient: ${profile.name} ${profile.surname}
    Birth Date: ${profile.birthDate}
    Blood Type: ${profile.bloodType}
    Allergies: ${profile.allergies.join(', ')}
    Diagnoses: ${profile.diagnoses.map(d => `${d.date}: ${d.condition}`).join('; ')}
    Prescriptions: ${profile.prescriptions.map(p => `${p.medication} (${p.dosage})`).join('; ')}
    
    Keep it concise for a doctor to read quickly.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        temperature: 0.7,
        topP: 0.95,
      }
    });

    return response.text || (lang === Language.RU ? "Не удалось сгенерировать сводку." : "Xulosa yaratib bo'lmadi.");
  } catch (error) {
    console.error("Gemini Error:", error);
    return lang === Language.RU ? "Ошибка при анализе данных." : "Ma'lumotlarni tahlil qilishda xatolik.";
  }
}

export interface DoctorSearchResult {
  text: string;
  links: { title: string; uri: string }[];
}

export async function searchDoctors(
  specialty: string, 
  location: string, 
  lang: Language,
  distance?: string,
  availability?: string,
  acceptsNewPatients?: boolean,
  languagesSpoken?: string
): Promise<DoctorSearchResult> {
  const model = "gemini-2.5-flash-lite-latest";
  
  let prompt = `Find doctors or clinics with specialty "${specialty}" in the area of "${location}".`;
  
  if (distance && distance !== 'any') {
    prompt += ` Prefer results within a ${distance} km radius of center.`;
  }
  
  if (availability === 'today') {
    prompt += ` Only include places available for appointments today.`;
  }

  if (acceptsNewPatients) {
    prompt += ` Look for doctors accepting new patients.`;
  }

  if (languagesSpoken && languagesSpoken !== 'any') {
    prompt += ` Doctor must speak ${languagesSpoken}.`;
  }

  prompt += ` Provide a list of 3-5 best options with names, addresses, and short descriptions.
  CRITICAL: For each result, make sure to show:
  1. A realistic rating (e.g. ⭐ 4.9/5.0) as the first item for each result.
  2. The number of reviews (e.g. 120 отзывов).
  3. Years of experience and a brief bio/education info.
  
  Format each result with a clear bold header and bullet points for rating and reviews to make them visible and prominent.
  Answer in ${lang === Language.RU ? 'Russian' : 'Uzbek'}.`;

  try {
    let latLng = undefined;
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
      });
      latLng = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
    } catch (e) {
      console.warn("Could not get geolocation", e);
    }

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: latLng
          }
        }
      }
    });

    const text = response.text || "";
    const links: { title: string; uri: string }[] = [];

    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.maps) {
          links.push({
            title: chunk.maps.title || (lang === Language.RU ? "Посмотреть на карте" : "Xaritada ko'rish"),
            uri: chunk.maps.uri
          });
        }
      });
    }

    return { text, links };
  } catch (error) {
    console.error("Search Doctors Error:", error);
    throw error;
  }
}
