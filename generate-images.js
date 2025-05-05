const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// 設定を読み込む
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

// 出力ディレクトリを作成
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir);
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

// 各画像を生成
Object.entries(config).forEach(([imageName, settings]) => {
  const fontSize = settings.font_size.replace('px', '');
  const imageHeight = calculateHeight(settings.text, fontSize);
  const formattedText = formatMultilineText(settings.text, fontSize);
  
  // SVGを生成
  const svg = `
    <?xml version="1.0" encoding="UTF-8"?>
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
    </svg>
  `;
  
  // SVGをバッファに変換
  const svgBuffer = Buffer.from(svg);
  
  // SVGをJPGとPNGに変換
  Promise.all([
    sharp(svgBuffer).jpeg().toFile(path.join(distDir, `${imageName}.jpg`)),
    sharp(svgBuffer).png().toFile(path.join(distDir, `${imageName}.png`))
  ]).then(() => {
    console.log(`Generated ${imageName}.jpg and ${imageName}.png`);
  }).catch(err => {
    console.error(`Error generating ${imageName}:`, err);
  });
});
