// generateP5.js

const prompt = `
あなたは優秀なクリエイティブコーダーです。
p5jsのコードを生成してください。
以下の条件を必ず守ってください。
- コードは必ず1つのsetup関数とdraw関数を含むこと
- 生成するコードは必ず視覚的に美しいアニメーションを含むこと
- 生成するコードは必ず1000行以内であること
- 生成するコードは必ずランダム性を含むこと
- 生成するコードは必ずキャンバスの大きさを600x400ピクセルに設定していること
`;

import 'dotenv/config';
import { GoogleGenAI, Type } from '@google/genai';
import { writeFile, readFile, readdir } from 'fs/promises';

// 環境変数からAPIキーを読み込む
// GEMINI_API_KEY が設定されていない場合はエラーになります
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("Error: GEMINI_API_KEY environment variable is not set.");
  process.exit(1);
}

const outputDirPath = 'p5codes/';
const outputFilePath = outputDirPath + Date.now().toString() + ".json";


// クライアントを初期化
// APIキーは自動的に環境変数から読み込まれます。
const ai = new GoogleGenAI({ apiKey });

/**
 * Gemini-2.5-flashモデルを使用してプロンプトを送信し、応答を取得する
 */
async function runGeminiQuery() {
  const modelName = 'gemini-2.5-flash';

  console.log(`Sending prompt to ${modelName}...`);
  console.log(`Prompt: "${prompt.substring(0, 50)}..."`);

  try {
    // コンテンツ生成をリクエスト
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
            },
            discription: {
              type: Type.STRING,
            },
            code: {
              type: Type.STRING,
            },
          },
          propertyOrdering: ["title", "discription", "code"],
        }
      }
    });

    // 応答のテキスト部分を出力
    console.log('\n--- Gemini Response ---');
    console.log(response.text);
    console.log('-------------------------\n');

    // トークンの使用状況も確認できます
    const usage = response.usageMetadata;
    console.log(`Total Tokens Used: ${usage.totalTokenCount}`);

    // 結果をファイル保存
    await writeFile(outputFilePath, response.text, 'utf8');

  } catch (error) {
    console.error("An error occurred during the API call:", error);
  }
}

// p5codesディレクトリの数だけiframeのあるHTMLを生成する
async function generateP5PreviewHTML() {
  const files = await readdir(outputDirPath);

  async function getIframeElements(filePath) {
    return `
    <iframe 
      srcdoc="${await getIframeSrcdocFromFilePath(filePath)}" 
      width="600" 
      height="400" 
      style="border:none;">
    </iframe>
    `;
  }
  async function getIframeSrcdocFromFilePath(filePath) {
    const json = await readFile(filePath, 'utf8');
    const obj = JSON.parse(json);
    const js = obj.code;
    return getIframeSrcdoc(js);
  }
  function getIframeSrcdoc(js) {
    const iframeSrcdoc = `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>P5.js Sketch</title>
    <script src="lib/p5.min.js"></script>
  </head>
  <body>
  <script>
  ${js}
  </script>
  </body>
  </html>`;
    return iframeSrcdoc;
  }


  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>P5.js Sketch Previews</title>
</head>
<body>
  <h1>P5.js Sketch Previews</h1>
  <iframe id="p5contents" width="600" height="400" style="border:none;"></iframe>
</body>
</html>`;

  console.log(htmlContent);

  try {
    await writeFile('p5preview.html', htmlContent, 'utf8');
  } catch (error) {
    console.error("An error occurred while generating HTML:", error);
  }

  // await fs.writeFile(path.join(__dirname, 'p5codes', 'index.html'), htmlContent, 'utf8');
  // console.log('Generated p5codes/index.html with iframe previews.');
}

// runGeminiQuery();
generateP5PreviewHTML();;