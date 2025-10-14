// index.js

const prompt = `
あなたは優秀な音色クリエイターです。
SuperColliderで以下のようなコードの形式で、新しい音色を生成してください。
{ arg out=0, freq=440, amp=0.1, gate=1;
    var sig;
    var env = EnvGen.ar(
        Env.adsr(0.01, 0.1, 0.8, 1.0, curve: -4),
        gate: gate,
        doneAction: 2
    );
    sig = SinOsc.ar(freq) * amp * env;
    Out.ar(out, sig ! 2);
}
`;

// SynthDef(\sine_def, {
//   arg out=0, freq=440, amp=0.1, gate=1;
//   var sig;
//   var env = EnvGen.ar(
//     Env.adsr(0.01, 0.1, 0.8, 1.0, curve: -4),
//     gate: gate,
//     doneAction: 2
//   );
//   sig = SinOsc.ar(freq) * amp * env;
//   Out.ar(out, sig! 2);
// }).add;

// const prompt = `
// あなたは優秀な音色クリエイターです。
// SuperColliderの音色の定義のコードを生成してください。
// `;

import 'dotenv/config';
import { GoogleGenAI, Type } from '@google/genai';
import { writeFile } from 'fs/promises';

// 環境変数からAPIキーを読み込む
// GEMINI_API_KEY が設定されていない場合はエラーになります
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("Error: GEMINI_API_KEY environment variable is not set.");
  process.exit(1);
}

const outputFilePath = 'SynthDefCodes/' + Date.now().toString() + ".json";


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
            SynthDefName: {
              type: Type.STRING,
            },
            discription: {
              type: Type.STRING,
            },
            code: {
              type: Type.STRING,
            },
          },
          propertyOrdering: ["SynthDefName", "discription", "code"],
        }
      }
    });

    // 応答のテキスト部分を出力
    console.log('\n--- Gemini Response ---');
    console.log(response.text);
    console.log('-------------------------\n');

    // トークンの使用状況も確認できます
    // const usage = response.usageMetadata;
    // console.log(`Total Tokens Used: ${usage.totalTokenCount}`);

    // 結果をファイル保存
    await writeFile(outputFilePath, response.text, 'utf8');

  } catch (error) {
    console.error("An error occurred during the API call:", error);
  }
}


runGeminiQuery();