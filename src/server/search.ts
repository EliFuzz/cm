import { getServerConfig, ServerTool } from 'src/server/server';

export const searchTools = (query: string, limit: number = 2): ServerTool[] => {
  const q = query.toLowerCase();
  const words = new Set(q.match(/\w+/g) || []);
  const tools = Object.values(getServerConfig().serverTools);

  const scoreWord = (word: string, target: Set<string>, weight: number) => {
    let score = 0;
    for (const w of target) {
      if (w === word) score += weight;
      else if (
        w.length > 2 &&
        word.length > 2 &&
        (w.includes(word) || word.includes(w))
      )
        score += weight * 0.3;
    }
    return score;
  };

  const toolScores = tools.map((tool) => {
    let score = 0;
    const toolNameLower = tool.name.toLowerCase();
    const toolNameOnly = toolNameLower.includes('.')
      ? toolNameLower.split('.').pop()!
      : toolNameLower;
    const serverName = toolNameLower.includes('.')
      ? toolNameLower.split('.').shift()!
      : '';

    if (
      q === toolNameOnly ||
      q.includes(toolNameOnly) ||
      toolNameOnly.includes(q)
    ) {
      score += 6;
    }

    if (q === serverName || q.includes(serverName) || serverName.includes(q)) {
      score += 5;
    }

    const toolNameWords = new Set(toolNameOnly.match(/\w+/g) || []);
    for (const word of toolNameWords) {
      score += scoreWord(word, words, 3);
    }

    const serverNameWords = new Set(serverName.match(/\w+/g) || []);
    for (const word of serverNameWords) {
      score += scoreWord(word, words, 2);
    }

    if (tool.description) {
      const descWords = new Set(
        tool.description.toLowerCase().match(/\w+/g) || []
      );
      for (const word of descWords) {
        if (word.length > 2) score += scoreWord(word, words, 1);
      }
    }
    return { tool, score };
  });

  return toolScores
    .toSorted(
      (
        a: { tool: ServerTool; score: number },
        b: { tool: ServerTool; score: number }
      ) => b.score - a.score
    )
    .filter(({ score }: { score: number }) => score > 0)
    .slice(0, limit)
    .map(({ tool }: { tool: ServerTool }) => tool);
};
