export interface Server {
  command?: string;
  args?: string[];
  url?: string;
  headers?: Record<string, string>;
  env?: Record<string, string>;
  codemode?: { allow?: string[]; deny?: string[] };
}

export interface Servers {
  servers: Record<string, Server>;
}
