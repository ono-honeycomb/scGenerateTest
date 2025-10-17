// SunthDefCodes内のjsonを順番に読み込んで、SuperColliderで再生
import { readdir, readFile } from "fs/promises";
import path from "path";
import { Client, Server } from "node-osc";

// SuperCollider(sclang)がリッスンしているデフォルトのポート
const SC_LANG_PORT = 57120;
const SC_LANG_HOST = "127.0.0.1";
const NODE_RECEIVE_PORT = 57121; // sclangのデフォルトと重複しないようにする

const SYNTHDEFS_DIR = "SynthDefCodes";

// 再生と再生の間の待機時間 (ミリ秒)
const PLAY_INTERVAL_MS = 2000;

/**
 * 指定されたミリ秒だけ待機するユーティリティ関数
 * @param {number} ms - 待機する時間（ミリ秒）
 * @returns {Promise<void>}
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * SuperColliderにOSCメッセージとしてコードを送信する
 * @param {Client} client - node-oscクライアントインスタンス
 * @param {string} codeToRun - 実行するSuperColliderコード
 */
function sendCodeToSC(client, codeToRun) {
  console.log(`Sending to SuperCollider: ${codeToRun}`);
  // SuperCollider側で定義した /interpret アドレスに、実行したいコードを文字列として送信
  client.send({
    address: "/interpret",
    args: [
      {
        type: "s",
        value: codeToRun,
      },
    ],
  });
}

/**
 * メインの実行関数
 */
async function main() {
  const client = new Client(SC_LANG_HOST, SC_LANG_PORT);
  console.log(`OSC client created for ${SC_LANG_HOST}:${SC_LANG_PORT}`);

  try {
    const files = await readdir(SYNTHDEFS_DIR);
    const jsonFiles = files.filter(
      (file) => path.extname(file).toLowerCase() === ".json"
    );

    if (jsonFiles.length === 0) {
      console.log(`No JSON files found in ${SYNTHDEFS_DIR}.`);
      client.close();
      return;
    }

    console.log(`Found ${jsonFiles.length} SynthDefs to play.`);

    for (const file of jsonFiles) {
      const filePath = path.join(SYNTHDEFS_DIR, file);
      const fileContent = await readFile(filePath, "utf8");
      const synthData = JSON.parse(fileContent);

      const { SynthDefName, code, discription } = synthData;

      console.log(`\n--- Playing: ${SynthDefName} ---`);
      console.log(`Description: ${discription}`);

      // SynthDefを定義し、それを再生するSuperColliderコードを構築
      // .addの後にSynth.newでインスタンスを生成
      const scCode = `
(
  SynthDef(\\${SynthDefName}, ${code}).add;
  Synth.new(\\${SynthDefName});
)`;
      sendCodeToSC(client, scCode);

      await sleep(PLAY_INTERVAL_MS);
    }
  } catch (error) {
    console.error("An error occurred:", error);
  } finally {
    console.log("\nFinished playing all synths. Closing OSC client.");
    client.close();
  }
}

main();

// SC側から受け取り
var oscServer = new Server(NODE_RECEIVE_PORT, SC_LANG_HOST, () => {
  console.log("OSC Server is listening");
});
oscServer.on("/sc/log", (msg) => {
  console.log(`SC Message: ${msg}`);
});
oscServer.on("/sc/error", (err) => {
  console.error(`${err.message}`);
});
