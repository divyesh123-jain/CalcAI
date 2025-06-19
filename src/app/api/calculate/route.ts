import { GoogleGenerativeAI } from "@google/generative-ai";

interface Response {
  expr: string;
  result: string;
  assign: boolean;
  steps?: string[];
}

interface GeneratedResult {
  expression: string;
  answer: string;
  steps?: string[];
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

// Helper function to extract JSON from markdown response
function extractJsonFromMarkdown(markdown: string): string {
  const jsonMatch = markdown.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
  if (jsonMatch && jsonMatch[1]) {
    return jsonMatch[1].trim();
  }
  const arrayMatch = markdown.match(/\[[\s\S]*?\]/);
  if (arrayMatch) {
    return arrayMatch[0].trim();
  }
  throw new Error("No valid JSON array found in response");
}

// Remove "export" from this function
async function analyzeImage(
  imageBase64: string,
  variable: Record<string, unknown>
): Promise<GeneratedResult> {
  try {
    if (!imageBase64 || typeof imageBase64 !== "string") {
      throw new Error("Invalid image data provided");
    }
    if (!variable || typeof variable !== "object") {
      throw new Error("Invalid variables provided");
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const variableStr = JSON.stringify(variable);

    const prompt = `
      Analyze the given image containing mathematical expressions or equations and provide step-by-step solutions.

### Rules for Solving:
- **Use PEMDAS for expressions**:  
  - Parentheses → Exponents → Multiplication & Division (L → R) → Addition & Subtraction (L → R).  
- **For equations**, solve for variables based on the provided information.  
- **Include main solving steps** (not every tiny detail, but key steps that help understanding).

### Variables Provided:
${variableStr}  

### Expected JSON Output:
- **Return ONLY a JSON array**, with no additional text or markdown.
- **Format with steps:**  
  \`\`\`json
  [{"expr": "2+3*4", "result": "14", "assign": false, "steps": ["Apply PEMDAS: Multiplication first", "3 × 4 = 12", "2 + 12 = 14"]}]
  \`\`\`

- **Handling Different Cases:**  
  1. **Mathematical Expressions (e.g., \`2 + 3 * 4\`)** → Solve with steps:  
     \`[{ "expr": "2+3*4", "result": "14", "assign": false, "steps": ["Apply PEMDAS: Multiplication first", "3 × 4 = 12", "2 + 12 = 14"] }]\`  
     
  2. **Equations with Variables (e.g., \`2x + 3 = 7\`)** → Solve for \`x\` with steps:  
     \`[{ "expr": "x", "result": "2", "assign": true, "steps": ["2x + 3 = 7", "Subtract 3 from both sides: 2x = 4", "Divide by 2: x = 2"] }]\`  
     
  3. **Complex expressions** → Break down into clear steps showing the process.
  
  4. **Simple calculations** → May have fewer steps like ["Direct calculation", "5 + 3 = 8"].

### Step Guidelines:
- Keep steps concise but educational
- Show the mathematical reasoning
- Include 2-4 main steps for most problems
- For simple additions/subtractions, steps can be minimal
- For complex equations, show algebraic manipulation steps

**Ensure valid JSON formatting and include helpful solving steps.**  
`.trim();

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const image = {
      inlineData: {
        data: base64Data,
        mimeType: "image/png",
      },
    };

    const response = await model.generateContent([prompt, image]);
    const result = await response.response;
    const textResponse = result.text();

    let answers: Response[] = [];
    try {
      try {
        answers = JSON.parse(textResponse);
      } catch {
        const extractedJson = extractJsonFromMarkdown(textResponse);
        answers = JSON.parse(extractedJson);
      }

      if (!Array.isArray(answers) || answers.length === 0) {
        throw new Error("Invalid response format or empty response");
      }

      const firstResult = answers[0];
      if (!firstResult.expr || !firstResult.result) {
        throw new Error("Response missing required fields");
      }

      return {
        expression: firstResult.expr,
        answer: firstResult.result,
        steps: firstResult.steps || []
      };
    } catch (e) {
      console.error("Error parsing Gemini API response:", e);
      throw new Error(
        `Failed to parse API response: ${
          e instanceof Error ? e.message : "Unknown error"
        }`
      );
    }
  } catch (error) {
    console.error("Error analyzing image:", error);
    throw error;
  }
}

// API route handler
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { image, variable } = body;

    if (!image || !variable) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    const result = await analyzeImage(image, variable);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("API Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
