import { createContext, runInContext } from 'node:vm';

interface SandboxInput {
  code: string;
  tools: Record<string, any>;
}

export const sandboxExec = async ({
  code,
  tools,
}: SandboxInput): Promise<{ result: any; logs: string[] }> => {
  const logs: string[] = [];
  const context = createContext({
    JSON,
    Promise,
    Array,
    Object,
    String,
    Number,
    Boolean,
    Math,
    Date,
    console: {
      log: (...args: unknown[]) => logs.push(formatArgs(args)),
      error: (...args: unknown[]) => logs.push('[ERROR] ' + formatArgs(args)),
      warn: (...args: unknown[]) => logs.push('[WARN] ' + formatArgs(args)),
      info: (...args: unknown[]) => logs.push('[INFO] ' + formatArgs(args)),
    },
    ...tools,
  });

  return await Promise.race([
    (async () => {
      try {
        const result = await Promise.resolve(
          runInContext(`(async () => { ${code} })()`, context)
        );
        logs.push(
          '[INFO] Execution completed successfully',
          '[INFO] Result: ' +
            (typeof result === 'object'
              ? JSON.stringify(result, null, 2)
              : String(result))
        );
        return { result, logs };
      } catch (error) {
        logs.push(
          '[ERROR] Execution failed: ' + (error as Error)?.message ||
            String(error)
        );
        throw error;
      }
    })(),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Execution timeout')), 30000)
    ),
  ]);
};

const formatArgs = (args: unknown[]) =>
  args
    .map((a) =>
      typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)
    )
    .join(' ');
