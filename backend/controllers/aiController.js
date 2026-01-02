import { generateAISummary } from '../services/openaiService.js';

export const summarizeWork = async (req, res) => {
  const { logs = [], tasks = [] } = req.body;
  const result = await generateAISummary({
    logs,
    tasks,
    employee: req.user.toSafeObject()
  });
  res.json(result);
};
