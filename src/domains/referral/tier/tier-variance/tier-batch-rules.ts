import { TierBatch } from "./tier-batch.js";

/** A rule a tier batch must pass. Check returns its problems, or none. */
export interface TierBatchRule {
  check(item: TierBatch): string[];
}

export class TierBatchStartsAtRangeRule implements TierBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TierBatch): string[] {
    const value = item.startsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`starts at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`starts at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TierBatchRequiredTitleRule implements TierBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TierBatch): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class TierBatchCodePrefixRule implements TierBatchRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TierBatch): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class TierBatchTitleLengthRule implements TierBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TierBatch): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a tier batch. */
export class TierBatchValidator {
  rules: TierBatchRule[];

  constructor(rules: TierBatchRule[]) {
    this.rules = rules;
  }

  validate(item: TierBatch): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TierBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TierBatch[]): Map<string, string[]> {
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

export function defaultTierBatchValidator(): TierBatchValidator {
  return new TierBatchValidator(
    [
      new TierBatchStartsAtRangeRule(120, 86400),
      new TierBatchRequiredTitleRule("tier batch needs a value"),
      new TierBatchCodePrefixRule("Q"),
      new TierBatchTitleLengthRule(32),
    ],
  );
}
