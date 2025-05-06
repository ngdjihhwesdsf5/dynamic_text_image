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
function formatMultilineText(text, fontSize, textAlign, verticalAlign) {
  const lines = text.split('\n');
  const lineHeight = parseInt(fontSize) * 1.2;
  const xPosition = textAlign === 'center' ? '400' : '0';
  const textAnchor = textAlign === 'center' ? 'middle' : 'start';
  
  // 垂直中央揃えの場合のみ特別な処理を行う
  if (verticalAlign === 'middle') {
    const totalHeight = lines.length * lineHeight;
    const startY = -(totalHeight / 2) + (lineHeight / 2);
    
    return lines.map((line, index) => 
      `<tspan x="${xPosition}" dy="${index === 0 ? startY : lineHeight}" text-anchor="${textAnchor}">${line}</tspan>`
    ).join('');
  } else {
    // 従来どおりの処理（上揃え）
    return lines.map((line, index) => 
      `<tspan x="${xPosition}" dy="${index === 0 ? 0 : lineHeight}" text-anchor="${textAnchor}">${line}</tspan>`
    ).join('');
  }
}

// SVGの高さ計算関数
function calculateHeight(text, fontSize, padding) {
  const lines = text.split('\n');
  const lineHeight = parseInt(fontSize) * 1.2;
  const paddingValues = padding ? padding.split(' ').map(p => parseInt(p)) : [0];
  const paddingTop = paddingValues[0] || 0;
  const paddingBottom = paddingValues.length > 1 ? paddingValues[2] : paddingTop;
  // 最低限の余白を確保
  const textHeight = 30 + (lines.length * lineHeight) + 10 + paddingTop + paddingBottom;
  return Math.max(100, textHeight);
}

// 各SVGを生成して保存
function generateSVGs() {
  for (const [imageName, settings] of Object.entries(config)) {
    try {
      const fontSize = parseInt(settings.font_size);
      const padding = settings.padding || '0';
      const imageHeight = calculateHeight(settings.text, fontSize, padding);
      
      // 背景色の決定（背景色が指定されていない場合は従来通りcolorを使用）
      const backgroundColor = settings.background_color || settings.color;
      
      // その他のスタイル設定
      const fontWeight = settings.font_weight || 'normal';
      const textAlign = settings.text_align || 'left';
      const verticalAlign = settings.vertical_align || 'top';
      const borderRadius = settings.border_radius || '0';
      const textColor = settings.text_color || 'black';
      
      // テキストのY位置を計算
      let yPosition;
      if (verticalAlign === 'middle') {
        yPosition = imageHeight / 2;
      } else {
        // 従来どおりの上部からの配置
        yPosition = 30 + (parseInt(padding.split(' ')[0]) || 0);
      }
      
      // SVG生成
      const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="800" height="${imageHeight}" viewBox="0 0 800 ${imageHeight}" xmlns="http://www.w3.org/2000/svg">
  <rect width="800" height="${imageHeight}" fill="${backgroundColor}" rx="${borderRadius}" ry="${borderRadius}"/>
  <text 
    x="${textAlign === 'center' ? 400 : parseInt(padding.split(' ')[0] || 0)}" 
    y="${yPosition}" 
    dominant-baseline="${verticalAlign === 'middle' ? 'middle' : 'auto'}"
    font-family="sans-serif" 
    font-size="${fontSize}" 
    font-weight="${fontWeight}"
    fill="${textColor || 'black'}"
    text-anchor="${textAlign === 'center' ? 'middle' : 'start'}">
    ${formatMultilineText(settings.text, settings.font_size, textAlign, verticalAlign)}
  </text>
</svg>`;
      
      // SVGファイルを保存
      fs.writeFileSync(path.join(distDir, `${imageName}.svg`), svg);
      
      // アクセス用にjpgファイル名でもSVGを保存
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