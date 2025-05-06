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

// SVGの高さ計算関数を修正（バナー用の余白を追加）
function calculateHeight(text, fontSize, hasBanner) {
  const lines = text.split('\n');
  const lineHeight = parseInt(fontSize) * 1.2;
  const textHeight = 100 + (lines.length * lineHeight);
  const bannerHeight = hasBanner ? 60 : 0; // バナーの高さ
  return Math.max(200, textHeight + bannerHeight + 80);
}

// テキスト位置調整関数を追加
function getTextPosition(settings) {
  if (settings.text_align === "center") {
    return 'x="400" text-anchor="middle"';
  }
  return 'x="20"'; // デフォルトは左寄せ
}

// 各SVGを生成して保存
function generateSVGs() {
  for (const [imageName, settings] of Object.entries(config)) {
    try {
      const fontSize = parseInt(settings.font_size);
      const imageHeight = calculateHeight(settings.text, fontSize);
      const textColor = settings.color || "black";
      const bgColor = settings.background_color || "#FFFFFF";
      const borderRadius = settings.border_radius || "0";
      const padding = settings.padding || "0";
      const fontWeight = settings.font_weight || "normal";
      const textPosition = getTextPosition(settings);
      
      // SVG生成（スタイル設定を適用）
      const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="800" height="${imageHeight}" viewBox="0 0 800 ${imageHeight}" xmlns="http://www.w3.org/2000/svg">
  <rect width="800" height="${imageHeight}" fill="#FFFFFF"/>
  <rect x="20" y="20" width="760" height="${imageHeight - 40}" rx="${borderRadius}" fill="${bgColor}"/>
  <text ${textPosition} y="50" font-family="sans-serif" font-size="${fontSize}" font-weight="${fontWeight}" fill="${textColor}" style="padding: ${padding};">
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