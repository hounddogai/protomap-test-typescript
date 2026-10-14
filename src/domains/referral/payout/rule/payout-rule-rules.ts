import { PayoutRule } from "./payout-rule.js";

/** A rule a payout rule must pass. Check returns its problems, or none. */
export interface PayoutRuleRule {
  check(item: PayoutRule): string[];
}

export class PayoutRuleActiveGuardRule implements PayoutRuleRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PayoutRule): string[] {
    if (item.active && item.quantity > this.limit) return [`quantity ${item.quantity} exceeds ${this.limit} while active`];
    return [];
  }
}

export class PayoutRuleRequiredNotesRule implements PayoutRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PayoutRule): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

export class PayoutRuleRequiredCodeRule implements PayoutRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PayoutRule): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PayoutRuleCodeLengthRule implements PayoutRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PayoutRule): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PayoutRuleVersionRangeRule implements PayoutRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PayoutRule): string[] {
    const value = item.version;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`version ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`version ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PayoutRuleAttemptsRangeRule implements PayoutRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PayoutRule): string[] {
    const value = item.attempts;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`attempts ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`attempts ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a payout rule. */
export class PayoutRuleValidator {
  rules: PayoutRuleRule[];

  constructor(rules: PayoutRuleRule[]) {
    this.rules = rules;
  }

  validate(item: PayoutRule): string[] {
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

  requireValid(item: PayoutRule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PayoutRule[]): Map<string, string[]> {
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

export function defaultPayoutRuleValidator(): PayoutRuleValidator {
  return new PayoutRuleValidator(
    [
      new PayoutRuleActiveGuardRule(3600),
      new PayoutRuleRequiredNotesRule("payout rule needs this field"),
      new PayoutRuleRequiredCodeRule("payout rule needs this field"),
      new PayoutRuleCodeLengthRule(3600),
      new PayoutRuleVersionRangeRule(1000, 86400),
      new PayoutRuleAttemptsRangeRule(64, 120),
    ],
  );
}
