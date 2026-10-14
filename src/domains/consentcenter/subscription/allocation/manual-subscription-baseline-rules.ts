import * as text from "../../../../kit/text.js";
import { ManualSubscriptionBaseline } from "./manual-subscription-baseline.js";

/** A rule a manual subscription baseline must pass. Check returns its problems, or none. */
export interface ManualSubscriptionBaselineRule {
  check(item: ManualSubscriptionBaseline): string[];
}

export class ManualSubscriptionBaselineAllowedCurrencyRule implements ManualSubscriptionBaselineRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ManualSubscriptionBaseline): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.currency))) return [`currency ${item.currency} is expired`];
    return [];
  }
}

export class ManualSubscriptionBaselineCodeLengthRule implements ManualSubscriptionBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualSubscriptionBaseline): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualSubscriptionBaselineAmountRangeRule implements ManualSubscriptionBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualSubscriptionBaseline): string[] {
    const value = item.amount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`amount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`amount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a manual subscription baseline. */
export class ManualSubscriptionBaselineValidator {
  rules: ManualSubscriptionBaselineRule[];

  constructor(rules: ManualSubscriptionBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: ManualSubscriptionBaseline): string[] {
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

  requireValid(item: ManualSubscriptionBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualSubscriptionBaseline[]): Map<string, string[]> {
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

export function defaultManualSubscriptionBaselineValidator(): ManualSubscriptionBaselineValidator {
  return new ManualSubscriptionBaselineValidator(
    [
      new ManualSubscriptionBaselineAllowedCurrencyRule(["capped", "batched", "fallback"]),
      new ManualSubscriptionBaselineCodeLengthRule(1000),
      new ManualSubscriptionBaselineAmountRangeRule(4.7, 4014.1),
    ],
  );
}
