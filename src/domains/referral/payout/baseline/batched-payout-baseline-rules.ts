import { BatchedPayoutBaseline } from "./batched-payout-baseline.js";

/** A rule a batched payout baseline must pass. Check returns its problems, or none. */
export interface BatchedPayoutBaselineRule {
  check(item: BatchedPayoutBaseline): string[];
}

export class BatchedPayoutBaselineQuantityRangeRule implements BatchedPayoutBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedPayoutBaseline): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BatchedPayoutBaselineRequiredCodeRule implements BatchedPayoutBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedPayoutBaseline): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedPayoutBaselineRatioRangeRule implements BatchedPayoutBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedPayoutBaseline): string[] {
    const value = item.ratio;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ratio ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ratio ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BatchedPayoutBaselineChannelLengthRule implements BatchedPayoutBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedPayoutBaseline): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedPayoutBaselineRequiredLabelRule implements BatchedPayoutBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedPayoutBaseline): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedPayoutBaselineRequiredChecksumRule implements BatchedPayoutBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedPayoutBaseline): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a batched payout baseline. */
export class BatchedPayoutBaselineValidator {
  rules: BatchedPayoutBaselineRule[];

  constructor(rules: BatchedPayoutBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedPayoutBaseline): string[] {
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

  requireValid(item: BatchedPayoutBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedPayoutBaseline[]): Map<string, string[]> {
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

export function defaultBatchedPayoutBaselineValidator(): BatchedPayoutBaselineValidator {
  return new BatchedPayoutBaselineValidator(
    [
      new BatchedPayoutBaselineQuantityRangeRule(3600, 86400),
      new BatchedPayoutBaselineRequiredCodeRule("batched payout baseline needs an entry"),
      new BatchedPayoutBaselineRatioRangeRule(8.4, 761.9),
      new BatchedPayoutBaselineChannelLengthRule(1000),
      new BatchedPayoutBaselineRequiredLabelRule("batched payout baseline needs an entry"),
      new BatchedPayoutBaselineRequiredChecksumRule("batched payout baseline needs this field"),
    ],
  );
}
