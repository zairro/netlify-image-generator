const path = require('path');
const { createCanvas, loadImage } = require('@napi-rs/canvas');

exports.handler = async (event) => {
  // Initialize at the top so it's available in error handling
  let bgPath;
  const canvas = createCanvas(1152, 768);
  const ctx = canvas.getContext('2d');

  try {
    // ===== 1. PATH RESOLUTION =====
    bgPath = path.join(
      process.env.NETLIFY_DEV ? __dirname : '/var/task',
      'assets/award.png'  // Simplified path
    );

    console.log('Loading background from:', bgPath);
    
    // ===== 2. LOAD ASSETS =====
    const bg = await loadImage(bgPath);
    ctx.drawImage(bg, 0, 0, 1152, 768);

    // ===== 3. PROFILE PHOTO =====
    if (event.queryStringParameters?.photo) {
      try {
        const photoImg = await loadImage(event.queryStringParameters.photo);
        // Circular mask (x=730, y=110, diameter=220)
        ctx.beginPath();
        ctx.arc(840, 220, 110, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(photoImg, 730, 110, 220, 220);
      } catch (e) {
        console.log("Using fallback circle");
        ctx.fillStyle = '#CCCCCC';
        ctx.beginPath();
        ctx.arc(840, 220, 110, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // ===== 4. RENDER TEXT =====
    ctx.fillStyle = '#2E2E2E';
    ctx.textAlign = 'left';
    ctx.font = 'bold 48px Arial';
    
    if (event.queryStringParameters?.first) {
      ctx.fillText(event.queryStringParameters.first.toUpperCase(), 730, 370);
    }
    if (event.queryStringParameters?.last) {
      ctx.fillText(event.queryStringParameters.last.toUpperCase(), 730, 430);
    }

    // ===== 5. RETURN IMAGE =====
    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=86400'
      },
      body: canvas.toBuffer('image/jpeg').toString('base64'),
      isBase64Encoded: true
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message,
        attemptedBackgroundPath: bgPath || 'Not defined',
        environment: process.env.NETLIFY_DEV ? 'Development' : 'Production'
      })
    };
  }
};