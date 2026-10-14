import { WarmupBatch } from "./warmup-batch.js";

/** A rule a warmup batch must pass. Check returns its problems, or none. */
export interface WarmupBatchRule {
  check(item: WarmupBatch): string[];
}

export class WarmupBatchTitleLengthRule implements WarmupBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WarmupBatch): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WarmupBatchRequiredTitleRule implements WarmupBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WarmupBatch): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class WarmupBatchRateRangeRule implements WarmupBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WarmupBatch): string[] {
    const value = item.rate;
    if (value < this.min || value > this.max) return [`rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WarmupBatchRequiredOwnerIdRule implements WarmupBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WarmupBatch): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a warmup batch. */
export class WarmupBatchValidator {
  rules: WarmupBatchRule[];

  constructor(rules: WarmupBatchRule[]) {
    this.rules = rules;
  }

  validate(item: WarmupBatch): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WarmupBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WarmupBatch[]): Map<string, string[]> {
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

export function defaultWarmupBatchValidator(): WarmupBatchValidator {
  return new WarmupBatchValidator(
    [
      new WarmupBatchTitleLengthRule(120),
      new WarmupBatchRequiredTitleRule("warmup batch needs an entry"),
      new WarmupBatchRateRangeRule(5.3, 2824.8),
      new WarmupBatchRequiredOwnerIdRule("warmup batch needs an entry"),
    ],
  );
}
