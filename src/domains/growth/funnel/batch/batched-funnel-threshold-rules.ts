import { BatchedFunnelThreshold } from "./batched-funnel-threshold.js";

/** A rule a batched funnel threshold must pass. Check returns its problems, or none. */
export interface BatchedFunnelThresholdRule {
  check(item: BatchedFunnelThreshold): string[];
}

export class BatchedFunnelThresholdCodePrefixRule implements BatchedFunnelThresholdRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BatchedFunnelThreshold): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BatchedFunnelThresholdRequiredDescriptionRule implements BatchedFunnelThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedFunnelThreshold): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedFunnelThresholdCreatedAtRangeRule implements BatchedFunnelThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedFunnelThreshold): string[] {
    const value = item.createdAt;
    if (value < this.min || value > this.max) return [`created at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a batched funnel threshold. */
export class BatchedFunnelThresholdValidator {
  rules: BatchedFunnelThresholdRule[];

  constructor(rules: BatchedFunnelThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedFunnelThreshold): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedFunnelThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedFunnelThreshold[]): Map<string, string[]> {
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

export function defaultBatchedFunnelThresholdValidator(): BatchedFunnelThresholdValidator {
  return new BatchedFunnelThresholdValidator(
    [
      new BatchedFunnelThresholdCodePrefixRule("REF"),
      new BatchedFunnelThresholdRequiredDescriptionRule("batched funnel threshold needs an entry"),
      new BatchedFunnelThresholdCreatedAtRangeRule(16, 32),
    ],
  );
}
