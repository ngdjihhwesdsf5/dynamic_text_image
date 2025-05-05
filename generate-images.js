const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// 設定を読み込む
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

// 出力ディレクトリを確認して作成
const distDir = 'dist';
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
  console.log(`Created directory: ${distDir}`);
}

// テキストを複数行に分割
function formatMultilineText(text, fontSize) {
  const lines = text.split('\n');
  const lineHeight = parseInt(fontSize) * 1.2;
  
  return lines.map((line, index) => 
    `<tspan x="400" dy="${index === 0 ? 0 : lineHeight}" text-anchor="middle">${line}</tspan>`
  ).join('');
}

// 画像の高さを計算
function calculateHeight(text, fontSize) {
  const lines = text.split('\n');
  const lineHeight = parseInt(fontSize) * 1.2;
  return Math.max(200, 100 + (lines.length * lineHeight) + 80);
}

// 各画像を生成して同期的に保存
async function generateImages() {
  console.log('Starting image generation...');
  
  for (const [imageName, settings] of Object.entries(config)) {
    try {
      const fontSize = settings.font_size.replace('px', '');
      const imageHeight = calculateHeight(settings.text, fontSize);
      const formattedText = formatMultilineText(settings.text, fontSize);
      
      // SVGを生成
      const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="800" height="${imageHeight}" viewBox="0 0 800 ${imageHeight}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style type="text/css">
      @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP&display=swap');
      text {
        font-family: 'Noto Sans JP', sans-serif;
      }
    </style>
  </defs>
  <rect width="800" height="${imageHeight}" fill="${settings.color}"/>
  <text x="400" y="80" font-size="${settings.font_size}" fill="white">
    ${formattedText}
  </text>
</svg>`;
      
      // SVGをバッファに変換
      const svgBuffer = Buffer.from(svg);
      
      // 画像ファイル名
      const jpgFilePath = path.join(distDir, `${imageName}.jpg`);
      const pngFilePath = path.join(distDir, `${imageName}.png`);
      
      // SVGをJPGとPNGに変換して保存
      await sharp(svgBuffer).jpeg().toFile(jpgFilePath);
      await sharp(svgBuffer).png().toFile(pngFilePath);
      
      console.log(`Successfully generated ${jpgFilePath} and ${pngFilePath}`);
    } catch (err) {
      console.error(`Error generating ${imageName}:`, err);
    }
  }
  
  // 確認用のindex.htmlファイルを作成
  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <title>Dynamic Banners</title>
</head>
<body>
  <h1>Generated Images</h1>
  ${Object.keys(config).map(name => `
  <div style="margin: 20px 0;">
    <h2>${name}</h2>
    <img src="${name}.jpg" alt="${name}" style="max-width: 100%;">
  </div>
  `).join('')}
</body>
</html>`;
  
  fs.writeFileSync(path.join(distDir, 'index.html'), htmlContent);
  console.log('Generated index.html');
}

// 関数を実行
generateImages().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
