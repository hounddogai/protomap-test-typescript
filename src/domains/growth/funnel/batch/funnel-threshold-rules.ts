import { FunnelThreshold } from "./funnel-threshold.js";

/** A rule a funnel threshold must pass. Check returns its problems, or none. */
export interface FunnelThresholdRule {
  check(item: FunnelThreshold): string[];
}

export class FunnelThresholdRequiredCodeRule implements FunnelThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FunnelThreshold): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class FunnelThresholdCodePrefixRule implements FunnelThresholdRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FunnelThreshold): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FunnelThresholdMarginRangeRule implements FunnelThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FunnelThreshold): string[] {
    const value = item.margin;
    if (value < this.min || value > this.max) return [`margin ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FunnelThresholdArchivedGuardRule implements FunnelThresholdRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: FunnelThreshold): string[] {
    if (item.archived && item.batchSize > this.limit) return [`batch size ${item.batchSize} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class FunnelThresholdLabelLengthRule implements FunnelThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FunnelThreshold): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a funnel threshold. */
export class FunnelThresholdValidator {
  rules: FunnelThresholdRule[];

  constructor(rules: FunnelThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: FunnelThreshold): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      const found = rule.check(item);
      if (found.length === 0) continue;
      for (const problem of found) {
        problems.push(`${item.code}: ${problem}`);
      }
    }
    return problems;
  }

  requireValid(item: FunnelThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FunnelThreshold[]): Map<string, string[]> {
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

export function defaultFunnelThresholdValidator(): FunnelThresholdValidator {
  return new FunnelThresholdValidator(
    [
      new FunnelThresholdRequiredCodeRule("funnel threshold needs this field"),
      new FunnelThresholdCodePrefixRule("ACM"),
      new FunnelThresholdMarginRangeRule(0.4, 3559.2),
      new FunnelThresholdArchivedGuardRule(80),
      new FunnelThresholdLabelLengthRule(86400),
    ],
  );
}
