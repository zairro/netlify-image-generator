const path = require('path');
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const fs = require('fs');

exports.handler = async (event) => {
  // ===== 1. BULLETPROOF PATH RESOLUTION =====
  const isLocal = Boolean(process.env.NETLIFY_DEV);
  const projectRoot = isLocal ? process.cwd() : '/var/task';
  const bgPath = path.join(projectRoot, 'assets/award.png');

  try {
    // Debug logging
    console.log(`Loading background from: ${bgPath}`);
    if (isLocal && !fs.existsSync(bgPath)) {
      throw new Error(`Local file not found. Current directory: ${process.cwd()}\n` +
        `Assets folder contents: ${fs.readdirSync(path.join(projectRoot, 'assets'))}`);
    }

    // ===== 2. IMAGE GENERATION =====
    const canvas = createCanvas(1152, 768);
    const ctx = canvas.getContext('2d');

    // Load background
    const bg = await loadImage(bgPath);
    ctx.drawImage(bg, 0, 0, 1152, 768);

    // Add profile photo (with fallback)
    if (event.queryStringParameters?.photo) {
      try {
        const photo = await loadImage(event.queryStringParameters.photo);
        // Circular mask (x=730, y=110, diameter=220)
        ctx.save();
        ctx.beginPath();
        ctx.arc(840, 220, 110, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(photo, 730, 110, 220, 220);
        ctx.restore();
      } catch (e) {
        console.log('Using fallback circle');
        ctx.fillStyle = '#CCCCCC';
        ctx.beginPath();
        ctx.arc(840, 220, 110, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Add text
    ctx.fillStyle = '#2E2E2E';
    ctx.textAlign = 'left';
    ctx.font = 'bold 48px Arial';

    if (event.queryStringParameters?.first) {
      ctx.fillText(event.queryStringParameters.first.toUpperCase(), 730, 370);
    }
    if (event.queryStringParameters?.last) {
      ctx.fillText(event.queryStringParameters.last.toUpperCase(), 730, 430);
    }
    if (event.queryStringParameters?.recognition) {
      ctx.font = 'bold 30px Arial';
      ctx.fillText(event.queryStringParameters.recognition.toUpperCase(), 730, 490);
    }

    // ===== 3. RETURN IMAGE =====
    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=86400' // 24-hour cache
      },
      body: canvas.toBuffer('image/jpeg').toString('base64'),
      isBase64Encoded: true
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message,
        debugInfo: {
          attemptedPath: bgPath,
          isLocal: isLocal,
          projectRoot: projectRoot,
          directoryContents: isLocal ? fs.readdirSync(projectRoot) : 'Not available in production'
        }
      }, null, 2) // Pretty-print JSON
    };
  }
};