import { aiClient, MEMGUARD_SYSTEM_INSTRUCTION } from '../_lib';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const message = req.body?.message || req.query?.message;
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Missing message parameter' });
  }

  if (aiClient) {
    try {
      const generatePromise = aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            role: 'user',
            parts: [{ text: `${MEMGUARD_SYSTEM_INSTRUCTION}\n\nOperator question: "${message}"\nProvide a concise 1-2 sentence response.` }],
          },
        ],
      });

      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3500));
      const response = await Promise.race([generatePromise, timeoutPromise]);

      if (response && response.text) {
        return res.status(200).json({
          reply: response.text.trim(),
          model: 'gemini-3.8-flash',
        });
      }
    } catch (err: any) {
      console.warn('[MemGuard] Live chat generation fallback:', err?.message);
    }
  }

  // Deterministic fallback based on MemGuard domain state
  const q = message.toLowerCase();
  let reply = 'MemGuard Voice Security Guard active. Zero-trust rules enforced across all agent vector stores.';
  if (q.includes('threat') || q.includes('status')) {
    reply = 'System threat level is currently Nominal. SHA-256 ledger integrity is verified, and action gatekeepers are armed.';
  } else if (q.includes('eml-102') || q.includes('invoice') || q.includes('quarantine')) {
    reply = 'Invoice EML-102 was quarantined due to direct prompt injection overrides and an unauthorized routing switch to Cayman account KY44119988776655443322.';
  } else if (q.includes('250,000') || q.includes('payment') || q.includes('blocked')) {
    reply = 'The $250,000 disbursement was blocked by the Zero-Trust Action Gatekeeper because plan PLAN-012 inherited taint from poisoned memory EML-102 (trust score 0.15 < 0.85 threshold).';
  } else if (q.includes('ledger') || q.includes('sha-256') || q.includes('tamper')) {
    reply = 'The cryptographic ledger chains SHA-256 hashes of every block and its predecessor. Any database alteration immediately invalidates the entire chain head.';
  } else if (q.includes('connect')) {
    reply = 'MemGuard Voice Co-Pilot connected successfully.';
  }

  return res.status(200).json({
    reply,
    model: 'memguard-deterministic-engine',
  });
}
