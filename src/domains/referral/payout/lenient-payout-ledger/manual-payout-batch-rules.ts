import { ManualPayoutBatch } from "./manual-payout-batch.js";

/** A rule a manual payout batch must pass. Check returns its problems, or none. */
export interface ManualPayoutBatchRule {
  check(item: ManualPayoutBatch): string[];
}

export class ManualPayoutBatchMarginRangeRule implements ManualPayoutBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualPayoutBatch): string[] {
    const value = item.margin;
    if (value < this.min || value > this.max) return [`margin ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ManualPayoutBatchChannelLengthRule implements ManualPayoutBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualPayoutBatch): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualPayoutBatchRequiredChannelRule implements ManualPayoutBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualPayoutBatch): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a manual payout batch. */
export class ManualPayoutBatchValidator {
  rules: ManualPayoutBatchRule[];

  constructor(rules: ManualPayoutBatchRule[]) {
    this.rules = rules;
  }

  validate(item: ManualPayoutBatch): string[] {
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

  requireValid(item: ManualPayoutBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualPayoutBatch[]): Map<string, string[]> {
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

export function defaultManualPayoutBatchValidator(): ManualPayoutBatchValidator {
  return new ManualPayoutBatchValidator(
    [
      new ManualPayoutBatchMarginRangeRule(6, 253.9),
      new ManualPayoutBatchChannelLengthRule(120),
      new ManualPayoutBatchRequiredChannelRule("manual payout batch needs a value"),
    ],
  );
}
