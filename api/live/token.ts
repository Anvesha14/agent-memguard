import { aiClient, MEMGUARD_SYSTEM_INSTRUCTION } from '../_lib';

export default async function handler(req: any, res: any) {
  // Support CORS if needed
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!aiClient) {
    return res.status(503).json({
      error: 'GEMINI_API_KEY is not configured on the server. Live API requires a valid Gemini API key.',
      connected: false,
    });
  }

  try {
    const tokenObj = await (aiClient as any).authTokens.create({});
    const tokenName = tokenObj.name;
    const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained?access_token=${encodeURIComponent(tokenName)}`;

    return res.status(200).json({
      token: tokenName,
      wsUrl,
      model: 'models/gemini-3.8-live',
      systemInstruction: MEMGUARD_SYSTEM_INSTRUCTION,
      connected: true,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[MemGuard] Failed to mint ephemeral Live API token:', err);
    return res.status(500).json({
      error: `Failed to create ephemeral Live API token: ${err?.message || err}`,
      connected: false,
    });
  }
}
