// import { GoogleGenerativeAI } from "@google/generative-ai";

// interface Response {
//   expr: string;
//   result: string;
//   assign: boolean;
// }

// interface GeneratedResult {
//   expression: string;
//   answer: string;
// }

// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

// // Helper function to extract JSON from markdown response
// function extractJsonFromMarkdown(markdown: string): string {
//   // Remove markdown code block syntax
//   const jsonMatch = markdown.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
//   if (jsonMatch && jsonMatch[1]) {
//     return jsonMatch[1].trim();
//   }
//   // If no code block found, try to find array directly
//   const arrayMatch = markdown.match(/\[[\s\S]*?\]/);
//   if (arrayMatch) {
//     return arrayMatch[0].trim();
//   }
//   throw new Error("No valid JSON array found in response");
// }

// async function analyzeImage(
//   imageBase64: string,
//   variable: Record<string, unknown>
// ): Promise<GeneratedResult> {
//   try {
//     // Validate inputs
//     if (!imageBase64 || typeof imageBase64 !== 'string') {
//       throw new Error("Invalid image data provided");
//     }

//     if (!variable || typeof variable !== "object") {
//       throw new Error("Invalid variables provided");
//     }

//     const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
//     const variableStr = JSON.stringify(variable);

//     const prompt = `
//      Analyze the given image containing mathematical expressions or equations.  

// ### Rules for Solving:
// - **Use PEMDAS for expressions**:  
//   - Parentheses → Exponents → Multiplication & Division (L → R) → Addition & Subtraction (L → R).  
// - **For equations**, solve for variables based on the provided information.  

// ### Variables Provided:
// ${variableStr}  

// ### Expected JSON Output:
// - **Return ONLY a JSON array**, with no additional text or markdown.
// - **Format:**  
//   \`\`\`json
//   [{"expr": "2+2", "result": "4", "assign": false}]
//   \`\`\`
// - **Handling Different Cases:**  
//   1. **Mathematical Expressions (e.g., \`2 + 3 * 4\`)** → Solve and return:  
//      \`[{ "expr": "2+3*4", "result": "14", "assign": false }]\`  
//   2. **Equations with Variables (e.g., \`2x + 3 = 7\`)** → Solve for \`x\`:  
//      \`[{ "expr": "x", "result": "2", "assign": true }]\`  
//   3. **Multiple Variable Equations (e.g., \`x + y = 10\`, \`x - y = 2\`)** → Solve separately:  
//      \`[{ "expr": "x", "result": "6", "assign": true }, { "expr": "y", "result": "4", "assign": true }]\`  
//   4. **Direct Variable Assignments (e.g., \`x = 5\`)** → Return assignment:  
//   \`[{ "expr": "x", "result": "5", "assign": true }
   
//   5. **Graphical or Abstract Math Problems** → Extract numerical or conceptual meaning and return accordingly.  

// **Ensure valid JSON formatting and correctness in all responses.**  
// `.trim();

//     // Remove data URL prefix if present
//     const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

//     // Format image for Gemini API
//     const image = {
//       inlineData: {
//         data: base64Data,
//         mimeType: "image/png"
//       }
//     };

//     const response = await model.generateContent([prompt, image]);
//     const result = await response.response;
//     const textResponse = result.text();

//     console.log("Raw API response:", textResponse); // For debugging

//     // Parse Gemini API Response
//     let answers: Response[] = [];
    
//     try {
//       // First try direct JSON parse
//       try {
//         answers = JSON.parse(textResponse);
//       } catch {
//         // If direct parse fails, try to extract JSON from markdown
//         const extractedJson = extractJsonFromMarkdown(textResponse);
//         answers = JSON.parse(extractedJson);
//       }
      
//       if (!Array.isArray(answers) || answers.length === 0) {
//         throw new Error("Invalid response format or empty response");
//       }

//       // Validate the structure of the first result
//       const firstResult = answers[0];
//       if (!firstResult.expr || !firstResult.result) {
//         throw new Error("Response missing required fields");
//       }

//       // Return formatted result
//       return {
//         expression: firstResult.expr,
//         answer: firstResult.result
//       };

//     } catch (e) {
//       console.error("Error parsing Gemini API response:", e);
//       throw new Error(`Failed to parse API response: ${e instanceof Error ? e.message : 'Unknown error'}`);
//     }

//   } catch (error) {
//     console.error("Error analyzing image:", error);
//     throw error;
//   }
// }

// // API route handler
// export async function POST(req: Request) {
//   try {
//     const body = await req.json();
//     const { image, variable } = body;

//     if (!image || !variable) {
//       return new Response(JSON.stringify({ error: "Missing required fields" }), {
//         status: 400,
//         headers: {
//           'Content-Type': 'application/json'
//         }
//       });
//     }

//     const result = await analyzeImage(image, variable);

//     return new Response(JSON.stringify(result), {
//       status: 200,
//       headers: {
//         'Content-Type': 'application/json'
//       }
//     });

//   } catch (error) {
//     console.error("API Error:", error);
//     return new Response(
//       JSON.stringify({ 
//         error: error instanceof Error ? error.message : 'Unknown error occurred' 
//       }), 
//       {
//         status: 500,
//         headers: {
//           'Content-Type': 'application/json'
//         }
//       }
//     );
//   }
// }

import { GoogleGenerativeAI } from "@google/generative-ai";

interface Response {
  expr: string;
  result: string;
  assign: boolean;
}

interface GeneratedResult {
  expression: string;
  answer: string;
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

    const prompt = `
      Analyze the given image containing mathematical expressions or equations.
      ...
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
