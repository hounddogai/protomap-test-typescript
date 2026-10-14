import { FallbackOptOutBatch } from "./fallback-opt-out-batch.js";

/** A rule a fallback opt out batch must pass. Check returns its problems, or none. */
export interface FallbackOptOutBatchRule {
  check(item: FallbackOptOutBatch): string[];
}

export class FallbackOptOutBatchUtmSourceLengthRule implements FallbackOptOutBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackOptOutBatch): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackOptOutBatchRatioRangeRule implements FallbackOptOutBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackOptOutBatch): string[] {
    const value = item.ratio;
    if (value < this.min || value > this.max) return [`ratio ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FallbackOptOutBatchScoreRangeRule implements FallbackOptOutBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackOptOutBatch): string[] {
    const value = item.score;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`score ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`score ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a fallback opt out batch. */
export class FallbackOptOutBatchValidator {
  rules: FallbackOptOutBatchRule[];

  constructor(rules: FallbackOptOutBatchRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackOptOutBatch): string[] {
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

  requireValid(item: FallbackOptOutBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackOptOutBatch[]): Map<string, string[]> {
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

export function defaultFallbackOptOutBatchValidator(): FallbackOptOutBatchValidator {
  return new FallbackOptOutBatchValidator(
    [
      new FallbackOptOutBatchUtmSourceLengthRule(120),
      new FallbackOptOutBatchRatioRangeRule(4.6, 3211.6),
      new FallbackOptOutBatchScoreRangeRule(9.5, 908.5),
    ],
  );
}
