const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();

// 静的ファイルの提供
app.use(express.static('p5codes'));
app.use('/lib', express.static(path.join(__dirname, 'node_modules/p5/lib')));

// プレビューページのテンプレート
const previewTemplate = (sketchFile) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
  html, body {
    margin: 0;
    padding: 0;
  }
  canvas {
    display: block;
  }
  </style>
  <script src="/lib/p5.min.js"></script>
</head>
<body>
  <script src="/${sketchFile}"></script>
</body>
</html>
`;



// メインルート
app.get('/', (req, res) => {
  // p5codesディレクトリ内のファイル一覧を取得
  fs.readdir(path.join(__dirname, 'p5codes'), (err, files) => {
    if (err) {
      res.status(500).send('Error reading directory');
      return;
    }

    // .jsファイルのみをフィルタリング
    const sketches = files.filter(file => file.endsWith('.js'));

    // ファイル一覧を表示するHTMLを生成
    const listHTML = sketches.map(sketch =>
      `<li><a href="/preview/${sketch}">${sketch}</a></li>`
    ).join('');

    res.send(`
      <h1>P5.js Sketches</h1>
      <ul>${listHTML}</ul>
    `);
  });
});

// プレビュールート
app.get('/preview/:sketch', (req, res) => {
  const sketchFile = req.params.sketch;
  if (!fs.existsSync(path.join(__dirname, 'p5codes', sketchFile))) {
    res.status(404).send('Sketch not found');
    return;
  }
  res.send(previewTemplate(sketchFile));
});

// サーバー起動
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Preview server running at http://localhost:${PORT}`);
});