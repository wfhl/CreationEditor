export const SIMPLE_PROFILE = {
    subject: "Charismatic AI Influencer, engaging modern style, highly realistic and expressive face, relatable and energetic persona. Wearing trendy casual or specific niche clothing. Excellent eye contact and natural posture.",
    negativePrompt: "--no cartoon, anime, illustration, 3d render, distorted hands, bad anatomy, crossed eyes, extra fingers, text, watermark, signature, blurred face, low resolution, plastic skin, oversaturated, stiff pose.",
    defaultParams: "",
};

export const SIMPLE_THEMES = [
    {
        id: "A",
        name: "Historical Facts / Educational",
        description: "Direct to camera, engaging storyteller, sharing interesting facts or history (Chloe vs History style).",
        context: "Used for educational bits, 'Did you know?', or historical deep-dives.",
        basePrompt: "[Subject Definition], standing in a [Setting] dressed in [Outfit]. Talking directly to the camera with an expressive, engaging face. Documentary style lighting, sharp focus on subject, slightly blurred background.",
        defaultOutfit: "smart casual blazer, vintage-inspired blouse, or thematic historical accent piece",
        defaultSetting: "cozy library, museum exhibit backdrop, or clean minimalist studio"
    },
    {
        id: "B",
        name: "Daily Vlog / GRWM",
        description: "Handheld selfie style, casual, 'Get Ready With Me' or 'Day in the Life'.",
        context: "Casual updates, high intimacy, morning routines.",
        basePrompt: "[Subject Definition], shot in a [Setting], wearing [Outfit]. Handheld selfie perspective, slightly wide-angle lens distortion. Natural, bright window lighting. Casual, candid, and highly realistic everyday moment.",
        defaultOutfit: "casual loungewear, oversized hoodie, simple white tee and jeans",
        defaultSetting: "modern bright bedroom, aesthetic bathroom mirror, cozy kitchen"
    },
    {
        id: "C",
        name: "Tech & Product Review",
        description: "Desk setup, static camera, professional lighting, holding or pointing to something.",
        context: "Reviews, unboxings, sponsor shoutouts.",
        basePrompt: "[Subject Definition], sitting at a [Setting], wearing [Outfit]. Static tripod shot, medium framing. Professional YouTube studio lighting with colorful LED rim lights. Sharp focus, high production value.",
        defaultOutfit: "sleek dark turtleneck, modern streetwear, tech-bro minimalist zip-up",
        defaultSetting: "clutter-free desk with RGB lighting, clean studio background, podcast setup"
    },
    {
        id: "D",
        name: "Storytime / Walk & Talk",
        description: "Moving outdoor shot, lively, sharing a crazy story or motivation (Grayson Higs style).",
        context: "Motivational rants, crazy personal stories, highly engaging hooks.",
        basePrompt: "[Subject Definition], walking through a [Setting], wearing [Outfit]. Action shot, dynamic movement, hair slightly blowing. Natural outdoor lighting, bright and vibrant. Expressive hand gestures.",
        defaultOutfit: "stylish athletic wear, trendy outdoor jacket, layered streetwear",
        defaultSetting: "busy city street, sunny park path, aesthetic coffee shop exterior"
    },
    {
        id: "E",
        name: "Direct Commentary / Reaction",
        description: "Static medium shot, expressive reactions, perfect for green screen or split screen.",
        context: "Reacting to news, commenting on pop culture, giving hot takes.",
        basePrompt: "[Subject Definition], standing in a [Setting], wearing [Outfit]. Clean, distraction-free background. Bright ring-light style illumination. Highly expressive facial features, engaging eye contact.",
        defaultOutfit: "bold colored sweater, stylish graphic tee, sharp casual outfit",
        defaultSetting: "solid color backdrop, blurred aesthetic living room, studio setup"
    }
];

export const CAPTION_TEMPLATES = [
    {
        id: "viral-hook",
        label: "Viral Hook / Storytime",
        prompt: "Write an engaging Instagram Reel/TikTok caption for the topic. Start with a scroll-stopping hook (e.g., 'You won't believe this...'). Keep paragraphs short. Add related emojis. End with a question to drive comments."
    },
    {
        id: "educational",
        label: "Educational / 'Did You Know?'",
        prompt: "Write a fascinating educational caption. Open with a surprising fact or question about the topic. Break down the information in an easy-to-read way. End with 'Save this for later!'."
    },
    {
        id: "vlog-casual",
        label: "Casual Vlog / GRWM",
        prompt: "Write a relatable, casual caption like you are talking to a best friend. Mention your outfit or mood. Keep it light, authentic, and engaging. Include a relevant emoji aesthetic."
    },
    {
        id: "review-promo",
        label: "Review / Product Feature",
        prompt: "Write a structured review caption. Start with a strong opinion on the topic. List 2-3 key benefits or honest thoughts. End with a call to action (e.g., 'Link in bio' or 'Have you tried this?')."
    },
    {
        id: "motivational",
        label: "Motivational Rant",
        prompt: "Write a high-energy, motivational caption. Address the reader directly with 'Listen to me...'. Use short, punchy sentences. Deliver a strong takeaway about the topic."
    }
];
