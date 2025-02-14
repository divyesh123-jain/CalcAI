import { GoogleGenerativeAI } from "@google/generative-ai";

// Define proper interface for response type
interface ImageDataResponse {
  expr: string;
  result: number;
  assign?: boolean;
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

export async function analyzeImage(
  imageBuffer: Buffer, 
  dictOfVars: Record<string, unknown>
): Promise<ImageDataResponse[]> {
  try {
    // Validate inputs
    if (!imageBuffer || !(imageBuffer instanceof Buffer)) {
      throw new Error("Invalid image buffer provided");
    }

    if (!dictOfVars || typeof dictOfVars !== "object") {
      throw new Error("Invalid variables dictionary provided");
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const dictOfVarsStr = JSON.stringify(dictOfVars);

    const prompt = `
      You have an image with mathematical expressions, equations, or graphical problems. Solve using PEMDAS rules.
      User-assigned variables: ${dictOfVarsStr}.
      Return response as an array of objects: [{expr: "2+2", result: 4}].
    `.trim();

    // Properly format the image for the Gemini API
    const image = {
      inlineData: {
        data: imageBuffer.toString("base64"),
        mimeType: "image/png" // Adjust based on your image type
      }
    };

    const response = await model.generateContent([prompt, image]);
    const result = await response.response;
    const textResponse = result.text();

    // Parse Gemini API Response
    let answers: ImageDataResponse[] = [];
    
    try {
      answers = JSON.parse(textResponse);
      
      // Validate response structure
      if (!Array.isArray(answers)) {
        throw new Error("Invalid response format: expected array");
      }

      // Validate each answer object
      answers = answers.filter(answer => {
        return typeof answer.expr === "string" && 
               typeof answer.result === "number";
      });

    } catch (e) {
      console.error("Error parsing Gemini API response:", e);
      if (e instanceof Error) {
        throw new Error(`Failed to parse API response: ${e.message}`);
      } else {
        throw new Error("Failed to parse API response: Unknown error");
      }
    }

    // Add assign field and return
    return answers.map(answer => ({
      ...answer,
      assign: Boolean(answer.assign)
    }));

  } catch (error) {
    console.error("Error analyzing image:", error);
    throw error; // Re-throw to allow caller to handle the error
  }
}