import { GoogleGenAI } from "@google/genai";
import { Promotion, SKU } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API Key not found in environment variables");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generatePromotionAnnouncement = async (
  promotionName: string,
  startDate: string,
  endDate: string,
  items: { sku: SKU; promoPrice: number }[]
): Promise<string> => {
  const ai = getClient();
  if (!ai) return "AI Service Unavailable: Missing API Key.";

  const itemListString = items
    .map(
      (item) =>
        `- ${item.sku.name} (SKU: ${item.sku.code}): New Promo Price $${item.promoPrice} (Was $${item.sku.originalPrice})`
    )
    .join("\n");

  const prompt = `
    You are a professional marketing assistant for a major DJI Distributor in the GCC.
    Write a formal yet exciting email notification to our Dealers and Traders announcing a new promotion.

    Promotion Name: ${promotionName}
    Valid From: ${startDate}
    Valid Until: ${endDate}

    Items on Sale:
    ${itemListString}

    Instructions:
    - Keep it professional.
    - Emphasize the limited time nature.
    - Mention that they need to submit their sales report after the period to claim rebates.
    - Format with clear sections.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text || "Could not generate announcement.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating announcement. Please try again.";
  }
};