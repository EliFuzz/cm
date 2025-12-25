import { sandboxExec } from 'src/server/sandbox';
import { getServer, getServerConfig } from 'src/server/server';
import { z } from 'zod';

getServer().registerTool(
  'exec',
  {
    title: 'TypeScript code execution',
    description:
      'First use `search` tool to find all relevant tools. Execute TypeScript code with `return {fullToolName: await fullToolName(args)}`. Always `await` tool calls.',
    inputSchema: {
      code: z
        .string()
        .describe(
          'TypeScript code to execute. Execute multiple tools by returning multiple values in an object or using console.log(). Execute multiple tools in a sequence. Using base functionality of TypeScript and Node could build logic around tool calls.'
        ),
    },
    outputSchema: {
      result: z.any().optional().describe('Execution result'),
      logs: z.array(z.string()).describe('Console output'),
    },
  },
  async ({ code }: { code: string }) => ({
    content: [],
    structuredContent: await sandboxExec({
      code,
      tools: getServerConfig().tools,
    }),
  })
);
