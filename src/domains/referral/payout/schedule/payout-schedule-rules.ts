import { PayoutSchedule } from "./payout-schedule.js";

/** A rule a payout schedule must pass. Check returns its problems, or none. */
export interface PayoutScheduleRule {
  check(item: PayoutSchedule): string[];
}

export class PayoutScheduleSummaryLengthRule implements PayoutScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PayoutSchedule): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PayoutScheduleRequiredNameRule implements PayoutScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PayoutSchedule): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class PayoutScheduleBudgetRangeRule implements PayoutScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PayoutSchedule): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PayoutScheduleCodeLengthRule implements PayoutScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PayoutSchedule): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PayoutScheduleCodePrefixRule implements PayoutScheduleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PayoutSchedule): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PayoutScheduleCostRangeRule implements PayoutScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PayoutSchedule): string[] {
    const value = item.cost;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`cost ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`cost ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a payout schedule. */
export class PayoutScheduleValidator {
  rules: PayoutScheduleRule[];

  constructor(rules: PayoutScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: PayoutSchedule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PayoutSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PayoutSchedule[]): Map<string, string[]> {
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

export function defaultPayoutScheduleValidator(): PayoutScheduleValidator {
  return new PayoutScheduleValidator(
    [
      new PayoutScheduleSummaryLengthRule(32),
      new PayoutScheduleRequiredNameRule("payout schedule needs this field"),
      new PayoutScheduleBudgetRangeRule(2.5, 3261),
      new PayoutScheduleCodeLengthRule(86400),
      new PayoutScheduleCodePrefixRule("ACM"),
      new PayoutScheduleCostRangeRule(3, 4185.2),
    ],
  );
}
