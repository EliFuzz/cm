import { searchTools } from 'src/server/search';
import { getServer, getToolRegistry, ServerTool } from 'src/server/server';
import { z } from 'zod';

getServer().registerTool(
  'search',
  {
    title: 'Tool search',
    description: 'Search for tool.',
    inputSchema: {
      query: z
        .string()
        .describe(
          `A few relevant and specific tags or keywords to search for a tool. Add relevant server: ${Array.from(new Set(getToolRegistry().map((entry) => entry.serverName))).join(', ')}.`
        ),
    },
    outputSchema: {
      results: z
        .array(
          z.object({
            toolName: z.string().describe('Tool name with server prefix'),
            description: z.string().optional().describe('Tool description'),
            inputSchema: z.any().describe('Tool input schema'),
          })
        )
        .describe('Matched tools'),
    },
  },
  async ({ query }: { query: string }) => {
    const tools = searchTools(query);
    return {
      content: [],
      structuredContent: {
        results: tools.map((tool: ServerTool) => ({
          toolName: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
        })),
      },
    };
  }
);
