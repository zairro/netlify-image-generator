const path = require('path');
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const fs = require('fs');

exports.handler = async (event) => {
  const { first, last, title, recognition, photo } = event.queryStringParameters;
  const canvas = createCanvas(1152, 768);
  const ctx = canvas.getContext('2d');

  try {
    // ===== 1. BULLETPROOF PATH RESOLUTION =====
    const bgPath = path.join(
      process.env.NETLIFY_DEV ? __dirname : '/var/task',
      '../../assets/award.png'
    );
    
    console.log('Loading background from:', bgPath);

    // Local file existence check (dev only)
    if (process.env.NETLIFY_DEV && !fs.existsSync(bgPath)) {
      throw new Error(`Background image not found at: ${bgPath}`);
    }

    const bg = await loadImage(bgPath);
    ctx.drawImage(bg, 0, 0, 1152, 768);

    // ===== 2. PROFILE PHOTO HANDLING =====
    if (photo && isValidUrl(photo)) {
      try {
        const photoImg = await loadImage(photo);
        roundedImage(ctx, photoImg, 730, 110, 220, 220, 110);
      } catch (e) {
        console.log("Using fallback circle:", e.message);
        ctx.fillStyle = '#CCCCCC';
        ctx.beginPath();
        ctx.arc(840, 220, 110, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // ===== 3. TEXT RENDERING =====
    ctx.fillStyle = '#2E2E2E';
    ctx.textAlign = 'left';

    const firstName = (first || '').trim().toUpperCase();
    const lastName = (last || '').trim().toUpperCase();
    
    ctx.font = 'bold 48px "Arial Narrow", Arial, sans-serif';
    if (firstName) ctx.fillText(firstName, 730, 370);
    if (lastName) ctx.fillText(lastName, 730, 430);

    if (recognition) {
      ctx.font = 'bold 30px "Arial Narrow", Arial, sans-serif';
      wrapText(ctx, recognition.toUpperCase(), 730, 490, 400, 40);
    }

    // ===== 4. RETURN IMAGE =====
    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000'
      },
      body: canvas.toBuffer('image/jpeg').toString('base64'),
      isBase64Encoded: true
    };

  } catch (error) {
    return { 
      statusCode: 500, 
      body: JSON.stringify({
        error: error.message,
        attemptedPath: bgPath,
        directoryContents: process.env.NETLIFY_DEV ? fs.readdirSync(path.dirname(bgPath)) : 'Not available in production'
      }) 
    };
  }
};

// Helper: Circular profile photo
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
  
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line, x, y);
      line = words[n] + ' ';
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), x, y);
}

// Helper: Validate URLs
function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}