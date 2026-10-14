import * as text from "../../../../kit/text.js";
import { FallbackFunnelBatch } from "./fallback-funnel-batch.js";

/** A rule a fallback funnel batch must pass. Check returns its problems, or none. */
export interface FallbackFunnelBatchRule {
  check(item: FallbackFunnelBatch): string[];
}

export class FallbackFunnelBatchRequiredNotesRule implements FallbackFunnelBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackFunnelBatch): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackFunnelBatchAllowedCodeRule implements FallbackFunnelBatchRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FallbackFunnelBatch): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is not allowed`];
    return [];
  }
}

export class FallbackFunnelBatchRequiredNameRule implements FallbackFunnelBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackFunnelBatch): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a fallback funnel batch. */
export class FallbackFunnelBatchValidator {
  rules: FallbackFunnelBatchRule[];

  constructor(rules: FallbackFunnelBatchRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackFunnelBatch): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackFunnelBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackFunnelBatch[]): Map<string, string[]> {
    const report = new Map<string, string[]>();
    for (const item of items) {
      const problems = this.validate(item);
      if (problems.length > 0) {
        report.set(item.code, problems);
      }
    }
    return report;
  }
}

export function defaultFallbackFunnelBatchValidator(): FallbackFunnelBatchValidator {
  return new FallbackFunnelBatchValidator(
    [
      new FallbackFunnelBatchRequiredNotesRule("fallback funnel batch needs a value"),
      new FallbackFunnelBatchAllowedCodeRule(["batched"]),
      new FallbackFunnelBatchRequiredNameRule("fallback funnel batch needs this field"),
    ],
  );
}
