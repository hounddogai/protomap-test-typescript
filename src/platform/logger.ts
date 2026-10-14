/** Structured events consumed by the platform's log collector. */
export class Logger {
  constructor(private readonly scope: Record<string, unknown> = {}) {}
  child(scope: Record<string, unknown>): Logger { return new Logger({ ...this.scope, ...scope }); }
  info(event: string, fields: Record<string, unknown> = {}): void {
    process.stdout.write(JSON.stringify({ level: "info", event, ...this.scope, ...fields }) + "\n");
  }
  error(event: string, error: unknown): void {
    process.stderr.write(JSON.stringify({ level: "error", event, ...this.scope,
      error: error instanceof Error ? error.message : String(error) }) + "\n");
  }
}
