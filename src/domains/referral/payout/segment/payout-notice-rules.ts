import { PayoutNotice } from "./payout-notice.js";

/** A rule a payout notice must pass. Check returns its problems, or none. */
export interface PayoutNoticeRule {
  check(item: PayoutNotice): string[];
}

export class PayoutNoticeCodeLengthRule implements PayoutNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PayoutNotice): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PayoutNoticeBatchSizeRangeRule implements PayoutNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PayoutNotice): string[] {
    const value = item.batchSize;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`batch size ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`batch size ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PayoutNoticeRequiredSummaryRule implements PayoutNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PayoutNotice): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

export class PayoutNoticeCreatedAtRangeRule implements PayoutNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PayoutNotice): string[] {
    const value = item.createdAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`created at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`created at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a payout notice. */
export class PayoutNoticeValidator {
  rules: PayoutNoticeRule[];

  constructor(rules: PayoutNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: PayoutNotice): string[] {
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

  requireValid(item: PayoutNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PayoutNotice[]): Map<string, string[]> {
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

export function defaultPayoutNoticeValidator(): PayoutNoticeValidator {
  return new PayoutNoticeValidator(
    [
      new PayoutNoticeCodeLengthRule(80),
      new PayoutNoticeBatchSizeRangeRule(1000, 1000),
      new PayoutNoticeRequiredSummaryRule("payout notice needs a value"),
      new PayoutNoticeCreatedAtRangeRule(32, 120),
    ],
  );
}
