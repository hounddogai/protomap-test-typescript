import { BatchedConversionBundle } from "./batched-conversion-bundle.js";

/** A rule a batched conversion bundle must pass. Check returns its problems, or none. */
export interface BatchedConversionBundleRule {
  check(item: BatchedConversionBundle): string[];
}

export class BatchedConversionBundleFrequencyCapRangeRule implements BatchedConversionBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedConversionBundle): string[] {
    const value = item.frequencyCap;
    if (value < this.min || value > this.max) return [`frequency cap ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BatchedConversionBundleCodeLengthRule implements BatchedConversionBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedConversionBundle): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedConversionBundleActiveGuardRule implements BatchedConversionBundleRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: BatchedConversionBundle): string[] {
    if (item.active && item.threshold > this.limit) return [`threshold ${item.threshold} exceeds ${this.limit} while active`];
    return [];
  }
}

/** Runs every rule of a batched conversion bundle. */
export class BatchedConversionBundleValidator {
  rules: BatchedConversionBundleRule[];

  constructor(rules: BatchedConversionBundleRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedConversionBundle): string[] {
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

  requireValid(item: BatchedConversionBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedConversionBundle[]): Map<string, string[]> {
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

export function defaultBatchedConversionBundleValidator(): BatchedConversionBundleValidator {
  return new BatchedConversionBundleValidator(
    [
      new BatchedConversionBundleFrequencyCapRangeRule(64, 1000),
      new BatchedConversionBundleCodeLengthRule(1000),
      new BatchedConversionBundleActiveGuardRule(6.1),
    ],
  );
}
