import { describe, expect, it } from 'vitest';
import { sandboxExec } from "../../src/server/sandbox";

describe('Sandbox', () => {
    describe('basic functionality', () => {
        it('should execute code and return result', async () => {
            const code = `return 3 + 5;`;
            const { result } = await sandboxExec({ code, tools: {} });
            expect(result).toBe(8);
        });

        it('should handle code execution timeout', async () => {
            const code = `
            while (true) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            `;
            await expect(sandboxExec({ code, tools: {} })).rejects.toThrow();
        });

        it('should have access to basic JS globals', async () => {
            const code = `
            return {
                mathPi: Math.PI,
                dateNow: Date.now(),
                arrayMethods: Array.isArray([1, 2, 3]),
                jsonStringify: JSON.stringify({ isEnabled: true }),
                objectKeys: Object.keys({ a: 1, b: 2 })
            };
            `;
            const { result }: any = await sandboxExec({ code, tools: {} });
            expect(result.mathPi).toBe(Math.PI);
            expect(typeof result.dateNow).toBe('number');
            expect(result.arrayMethods).toBe(true);
            expect(result.jsonStringify).toBe('{"isEnabled":true}');
            expect(result.objectKeys).toEqual(['a', 'b']);
        });

        it('should handle code syntax errors', async () => {
            const invalidCode = `const invalid syntax here`;
            await expect(sandboxExec({ code: invalidCode, tools: {} })).rejects.toThrow();
        });

        it('should capture console logs', async () => {
            const code = `
              console.log('log');
              console.error('error');
              console.warn('warning');
              console.info('info');
            `;
            const { logs } = await sandboxExec({ code, tools: {} });
            expect(logs).toHaveLength(6);
            expect(logs[0]).toBe('log');
            expect(logs[1]).toBe('[ERROR] error');
            expect(logs[2]).toBe('[WARN] warning');
            expect(logs[3]).toBe('[INFO] info');
            expect(logs[4]).toBe('[INFO] Execution completed successfully');
            expect(logs[5]).toBe('[INFO] Result: undefined');
        });
    });

    describe('tool calling and namespaces', () => {
        it('should execute code with namespaced tool access', async () => {
            const tools = {
                testServer: {
                    add: async (args: any) => args.a + args.b,
                },
            };
            const code = `return await testServer.add({ a: 5, b: 3 });`;
            const { result } = await sandboxExec({ code, tools });
            expect(result).toBe(8);
        });

        it('should execute code with multiple namespaced tools', async () => {
            const tools = {
                math: {
                    add: async (args: any) => args.a + args.b,
                    multiply: async (args: any) => args.a * args.b,
                },
                str: {
                    concat: async (args: any) => args.a + args.b,
                },
            };
            const code = `
            const sum = await math.add({ a: 5, b: 3 });
            const product = await math.multiply({ a: 4, b: 2 });
            const txt = await str.concat({ a: 'Hello', b: 'World' });
            return { sum, product, txt };
            `;
            const { result }: any = await sandboxExec({ code, tools });
            expect(result.sum).toBe(8);
            expect(result.product).toBe(8);
            expect(result.txt).toBe('HelloWorld');
        });

        it('should chain multiple tool calls', async () => {
            const tools = {
                math: {
                    add: async (args: any) => args.a + args.b,
                    square: async (args: any) => args.n * args.n,
                },
            };
            const code = `
            const sum = await math.add({ a: 3, b: 4 });
            const squared = await math.square({ n: sum });
            return { sum, squared };
            `;
            const { result } = await sandboxExec({ code, tools });
            expect(result).toEqual({ sum: 7, squared: 49 });
        });

        it('should handle errors in tool calls', async () => {
            const tools = {
                test: {
                    fail: async () => { throw new Error('Tool failed'); },
                },
            };
            const code = `
            try {
                await test.fail();
                return 'should not reach';
            } catch (e) {
                return e.message;
            }
            `;
            const { result } = await sandboxExec({ code, tools });
            expect(result).toBe('Tool failed');
        });

        it('should work with non-namespaced tools', async () => {
            const tools = {
                simpleAdd: async (args: any) => args.a + args.b,
            };
            const code = `return await simpleAdd({ a: 10, b: 5 });`;
            const { result } = await sandboxExec({ code, tools });
            expect(result).toBe(15);
        });

        it('should handle sanitized tool names with hyphens', async () => {
            const tools = {
                api_docs: {
                    api_docs: async (args: any) => ({
                        source: args.sourceName,
                        type: args.resourceType
                    }),
                },
            };
            const code = `return await api_docs.api_docs({ sourceName: "product", resourceType: "query" });`;
            const { result } = await sandboxExec({ code, tools });
            expect(result).toEqual({ source: 'product', type: 'query' });
        });
    });
});
