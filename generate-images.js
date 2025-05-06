const fs = require('fs');
const path = require('path');

// 設定を読み込む
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

// 出力ディレクトリを確認して作成
const distDir = 'dist';
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// テキストを複数行に分割
function formatMultilineText(text, fontSize) {
  const lines = text.split('\n');
  const lineHeight = parseInt(fontSize) * 1.2;
  
  return lines.map((line, index) => 
    `<tspan x="0" dy="${index === 0 ? 0 : lineHeight}">${line}</tspan>`
  ).join('');
}

// 画像の高さを計算
function calculateHeight(text, fontSize) {
  const lines = text.split('\n');
  const lineHeight = parseInt(fontSize) * 1.2;
  return Math.max(200, 100 + (lines.length * lineHeight) + 80);
}

// 各SVGを生成して保存
function generateSVGs() {
  for (const [imageName, settings] of Object.entries(config)) {
    try {
      const fontSize = parseInt(settings.font_size);
      const imageHeight = calculateHeight(settings.text, fontSize);
      
      // 単純なSVG（文字化けしないよう配慮）
      const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="800" height="${imageHeight}" viewBox="0 0 800 ${imageHeight}" xmlns="http://www.w3.org/2000/svg">
  <rect width="800" height="${imageHeight}" fill="${settings.color}"/>
  <text x="0" y="50" font-family="sans-serif" font-size="${fontSize}" fill="black">
    ${formatMultilineText(settings.text, settings.font_size)}
  </text>
</svg>`;
      
      // SVGファイルを保存
      fs.writeFileSync(path.join(distDir, `${imageName}.svg`), svg);
      
      // アクセス用にjpgファイル名でもSVGを保存。ただし、実際にJPG生成始める場合は、この処理改善要する。
      fs.writeFileSync(path.join(distDir, `${imageName}.jpg`), svg);
    } catch (err) {
      console.error(`Error generating ${imageName}:`, err);
    }
  }
  
  // 確認用のindex.htmlファイルを作成
  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <title>Dynamic Banners</title>
  <meta charset="UTF-8">
</head>
<body>
  <h1>Generated Images</h1>
  ${Object.keys(config).map(name => `
  <div style="margin: 20px 0;">
    <h2>${name}</h2>
    <p><a href="./${name}.svg">${name}.svg</a> | <a href="./${name}.jpg">${name}.jpg</a></p>
    <img src="./${name}.svg" alt="${name}" style="max-width: 100%;">
  </div>
  `).join('')}
</body>
</html>`;
  
  fs.writeFileSync(path.join(distDir, 'index.html'), htmlContent);
}

// 関数を実行
generateSVGs();
console.log('All images generated successfully');