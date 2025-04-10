const { createCanvas, loadImage } = require('canvas');

exports.handler = async (event) => {
  const { first, last, title, recognition, photo } = event.queryStringParameters;
  const canvas = createCanvas(1152, 768);
  const ctx = canvas.getContext('2d');

  try {
    // 1. Load background
    const bg = await loadImage(`${process.env.URL}/assets/award.png`);
    ctx.drawImage(bg, 0, 0, 1152, 768);

    // 2. Add profile photo with error handling
    if (photo && isValidUrl(photo)) {
      try {
        const photoImg = await loadImageWithTimeout(photo, 3000); // 3-second timeout
        // Circular profile photo mask
        roundedImage(ctx, photoImg, 730, 110, 220, 220, 110); // 110px radius = circle
      } catch (e) {
        console.log("Profile photo failed:", e.message);
        // Fallback: Draw placeholder circle
        ctx.fillStyle = '#CCCCCC';
        ctx.beginPath();
        ctx.arc(840, 220, 110, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 3. Text styling
    ctx.fillStyle = '#2E2E2E';
    ctx.textAlign = 'left';

    // Name (two lines, uppercase)
    ctx.font = 'bold 48px "Arial Narrow", Arial, sans-serif';
    ctx.fillText(`${first?.toUpperCase() || ''}`.trim(), 730, 370);
    ctx.fillText(`${last?.toUpperCase() || ''}`.trim(), 730, 430);

    // Recognition (smaller, with max width)
    ctx.font = 'bold 30px "Arial Narrow", Arial, sans-serif';
    wrapText(ctx, recognition?.toUpperCase() || '', 730, 490, 400, 40);

    // 4. Return image
    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000' // 1-year cache
      },
      body: canvas.toBuffer('image/jpeg').toString('base64'),
      isBase64Encoded: true
    };

  } catch (error) {
    return { statusCode: 500, body: error.message };
  }
};

// Helper: Circular image mask
function roundedImage(ctx, img, x, y, w, h, r) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x + w/2, y + h/2, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(img, x, y, w, h);
  ctx.restore();
}

// Helper: Text wrapping
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let testLine;
  
  for (let n = 0; n < words.length; n++) {
    testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line, x, y);
      line = words[n] + ' ';
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y);
}

// Helper: URL validation
function isValidUrl(url) {
  try { return Boolean(new URL(url)); } 
  catch { return false; }
}

// Helper: Image load timeout
function loadImageWithTimeout(url, timeout) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
    setTimeout(() => reject(new Error('Timeout')), timeout);
  });
}