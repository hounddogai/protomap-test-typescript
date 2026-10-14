import * as text from "../../../../kit/text.js";
import { PayoutBatch } from "./payout-batch.js";

/** A rule a payout batch must pass. Check returns its problems, or none. */
export interface PayoutBatchRule {
  check(item: PayoutBatch): string[];
}

export class PayoutBatchAllowedLocaleRule implements PayoutBatchRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PayoutBatch): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.locale))) return [`locale ${item.locale} is above maximum`];
    return [];
  }
}

export class PayoutBatchCodePrefixRule implements PayoutBatchRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PayoutBatch): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PayoutBatchLimitRangeRule implements PayoutBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PayoutBatch): string[] {
    const value = item.limit;
    if (value < this.min || value > this.max) return [`limit ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PayoutBatchRequiredLocaleRule implements PayoutBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PayoutBatch): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class PayoutBatchLocaleLengthRule implements PayoutBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PayoutBatch): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PayoutBatchRequiredCodeRule implements PayoutBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PayoutBatch): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a payout batch. */
export class PayoutBatchValidator {
  rules: PayoutBatchRule[];

  constructor(rules: PayoutBatchRule[]) {
    this.rules = rules;
  }

  validate(item: PayoutBatch): string[] {
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

  requireValid(item: PayoutBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PayoutBatch[]): Map<string, string[]> {
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

export function defaultPayoutBatchValidator(): PayoutBatchValidator {
  return new PayoutBatchValidator(
    [
      new PayoutBatchAllowedLocaleRule(["adaptive"]),
      new PayoutBatchCodePrefixRule("ACM"),
      new PayoutBatchLimitRangeRule(80, 3600),
      new PayoutBatchRequiredLocaleRule("payout batch needs this field"),
      new PayoutBatchLocaleLengthRule(120),
      new PayoutBatchRequiredCodeRule("payout batch needs a value"),
    ],
  );
}
