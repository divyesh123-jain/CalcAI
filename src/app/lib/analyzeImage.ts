import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

interface ImageDataResponse {
  expr: string;
  result: number;
  assign?: boolean;
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

export async function POST(req: Request) {
  try {
    const { imageBuffer, dictOfVars } = await req.json();

    if (!imageBuffer || !dictOfVars) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const dictOfVarsStr = JSON.stringify(dictOfVars);

    const prompt = `
      Analyze the given image containing mathematical expressions or equations.

      ### Rules for Solving:
      - Use PEMDAS for expressions: Parentheses → Exponents → Multiplication & Division (L → R) → Addition & Subtraction (L → R).
      - Solve equations for variables using provided information.

      ### Variables Provided:
      ${dictOfVarsStr}

      ### Expected JSON Output:
      - Return ONLY a JSON array, no additional text or markdown.
      - Format:
        [{"expr": "2+2", "result": 4, "assign": false}]

      - Handling Different Cases:
        1. **Mathematical Expressions (e.g., "2 + 3 * 4")** → Solve and return:
           [{"expr": "2+3*4", "result": 14, "assign": false}]
        2. **Equations with Variables (e.g., "2x + 3 = 7")** → Solve for x:
           [{"expr": "x", "result": 2, "assign": true}]
        3. **Multiple Variable Equations (e.g., "x + y = 10", "x - y = 2")** → Solve separately:
           [{"expr": "x", "result": 6, "assign": true}, {"expr": "y", "result": 4, "assign": true}]
        4. **Direct Variable Assignments (e.g., "x = 5")** → Return assignment:
           [{"expr": "x", "result": 5, "assign": true}]
        5. **Graphical or Abstract Math Problems** → Extract numerical or conceptual meaning and return accordingly.

      Ensure the response is **valid JSON** with the correct structure.
    `.trim();

    // Properly format the image for the Gemini API
    const image = {
      inlineData: {
        data: imageBuffer,
        mimeType: "image/png", // Adjust based on actual image type
      },
    };

    const response = await model.generateContent([prompt, image]);
    const result = await response.response;
    const textResponse = result.text();

    let answers: ImageDataResponse[] = [];

    try {
      answers = JSON.parse(textResponse);

      if (!Array.isArray(answers)) {
        throw new Error("Invalid response format: expected an array");
      }

      answers = answers.filter(
        (answer) => typeof answer.expr === "string" && typeof answer.result === "number"
      );
    } catch (e) {
      console.error("Error parsing Gemini API response:", e);
      return NextResponse.json({ error: "Failed to parse API response" }, { status: 500 });
    }

    return NextResponse.json(
      answers.map((answer) => ({
        ...answer,
        assign: Boolean(answer.assign),
      }))
    );
  } catch (error) {
    console.error("Error analyzing image:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}