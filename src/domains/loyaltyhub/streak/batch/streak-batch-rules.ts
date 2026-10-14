import { StreakBatch } from "./streak-batch.js";

/** A rule a streak batch must pass. Check returns its problems, or none. */
export interface StreakBatchRule {
  check(item: StreakBatch): string[];
}

export class StreakBatchChannelLengthRule implements StreakBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StreakBatch): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StreakBatchRequiredCodeRule implements StreakBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StreakBatch): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class StreakBatchUtmSourceLengthRule implements StreakBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StreakBatch): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StreakBatchRateRangeRule implements StreakBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StreakBatch): string[] {
    const value = item.rate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StreakBatchTitleLengthRule implements StreakBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StreakBatch): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StreakBatchRequiredUtmSourceRule implements StreakBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StreakBatch): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a streak batch. */
export class StreakBatchValidator {
  rules: StreakBatchRule[];

  constructor(rules: StreakBatchRule[]) {
    this.rules = rules;
  }

  validate(item: StreakBatch): string[] {
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

  requireValid(item: StreakBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StreakBatch[]): Map<string, string[]> {
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

export function defaultStreakBatchValidator(): StreakBatchValidator {
  return new StreakBatchValidator(
    [
      new StreakBatchChannelLengthRule(86400),
      new StreakBatchRequiredCodeRule("streak batch needs this field"),
      new StreakBatchUtmSourceLengthRule(255),
      new StreakBatchRateRangeRule(7.8, 3909.7),
      new StreakBatchTitleLengthRule(120),
      new StreakBatchRequiredUtmSourceRule("streak batch needs an entry"),
    ],
  );
}
