import OpenAI from 'openai';

let client = null;
const ensureClient = () => {
  if (!process.env.OPENAI_API_KEY)
    throw new Error('Missing OPENAI_API_KEY environment variable.');
  if (!client) client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return client;
};

export const generateAISummary = async ({ logs, tasks, employee }) => {
  const prompt = `
You are WorkHub AI, a productivity analyst. Summarize the following logs and tasks for ${
    employee?.name || 'employee'
  }.

Logs: ${JSON.stringify(logs)}
Tasks: ${JSON.stringify(tasks)}

Return valid JSON with keys summary, redFlags (array), suggestions (array). Keep it concise and actionable.
`.trim();

  try {
    const sdk = ensureClient();
    const response = await sdk.responses.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      input: prompt,
      temperature: 0.2
    });

    const content =
      response.output?.[0]?.content?.[0]?.text || response.output_text || '{}';
    const parsed = JSON.parse(content);
    return parsed;
  } catch (error) {
    const fallback =
      error.message?.includes('OPENAI_API_KEY') || error.message?.includes('Missing')
        ? 'OpenAI key missing. Provide OPENAI_API_KEY in backend env.'
        : 'Unable to reach OpenAI. Please verify credentials.';

    console.error('OpenAI error:', error.message);
    return {
      summary: fallback,
      redFlags: [],
      suggestions: []
    };
  }
};
