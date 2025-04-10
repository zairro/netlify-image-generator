# Dynamic Image Generator for Email Campaigns  

## Overview  
This project creates **personalized images** for email campaigns by dynamically generating award certificates with recipient-specific details (name, title, photo, etc.). The system uses a **Netlify serverless function** to combine a background template with dynamic text and images, producing unique JPEGs for each recipient.  

## How It Works  
1. **Dynamic URL Structure**:  
   The generator uses a URL with query parameters to customize each image (e.g., `https://your-site.netlify.app/.netlify/functions/generate-image?first=John&last=Doe&recognition=Top%20Performer&photo=URL`).  
2. **Image Generation**:  
   When the URL is accessed, the serverless function overlays the recipient’s details (name, photo, award text) onto a predefined template and returns a JPEG.  
3. **Integration**:  
   Use the URL in **Outlook Mail Merge** or **Gmail/GMail extensions** to embed personalized images in emails.  

## Setup  
1. Deploy the Netlify function (included in `/netlify/functions/`).  
2. Store your background template in `/assets/`.  
3. Call the URL in emails with recipient-specific parameters.  

**Example URL**:  
`https://your-site.netlify.app/.netlify/functions/generate-image?first=Jane&last=Smith&photo=...`
