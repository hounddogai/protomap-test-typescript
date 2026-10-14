import { BatchedPayoutWindow } from "./batched-payout-window.js";

/** A rule a batched payout window must pass. Check returns its problems, or none. */
export interface BatchedPayoutWindowRule {
  check(item: BatchedPayoutWindow): string[];
}

export class BatchedPayoutWindowThresholdRangeRule implements BatchedPayoutWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedPayoutWindow): string[] {
    const value = item.threshold;
    if (value < this.min || value > this.max) return [`threshold ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BatchedPayoutWindowCodeLengthRule implements BatchedPayoutWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedPayoutWindow): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedPayoutWindowRequiredContactEmailRule implements BatchedPayoutWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedPayoutWindow): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedPayoutWindowCodePrefixRule implements BatchedPayoutWindowRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BatchedPayoutWindow): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a batched payout window. */
export class BatchedPayoutWindowValidator {
  rules: BatchedPayoutWindowRule[];

  constructor(rules: BatchedPayoutWindowRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedPayoutWindow): string[] {
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

  requireValid(item: BatchedPayoutWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedPayoutWindow[]): Map<string, string[]> {
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

export function defaultBatchedPayoutWindowValidator(): BatchedPayoutWindowValidator {
  return new BatchedPayoutWindowValidator(
    [
      new BatchedPayoutWindowThresholdRangeRule(3.3, 4363),
      new BatchedPayoutWindowCodeLengthRule(120),
      new BatchedPayoutWindowRequiredContactEmailRule("batched payout window needs this field"),
      new BatchedPayoutWindowCodePrefixRule("OPS"),
    ],
  );
}
