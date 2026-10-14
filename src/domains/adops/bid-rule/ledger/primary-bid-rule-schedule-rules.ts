import { PrimaryBidRuleSchedule } from "./primary-bid-rule-schedule.js";

/** A rule a primary bid rule schedule must pass. Check returns its problems, or none. */
export interface PrimaryBidRuleScheduleRule {
  check(item: PrimaryBidRuleSchedule): string[];
}

export class PrimaryBidRuleScheduleCodePrefixRule implements PrimaryBidRuleScheduleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PrimaryBidRuleSchedule): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PrimaryBidRuleScheduleRequiredCodeRule implements PrimaryBidRuleScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryBidRuleSchedule): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryBidRuleScheduleCostRangeRule implements PrimaryBidRuleScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryBidRuleSchedule): string[] {
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

export class PrimaryBidRuleScheduleRequiredCurrencyRule implements PrimaryBidRuleScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryBidRuleSchedule): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a primary bid rule schedule. */
export class PrimaryBidRuleScheduleValidator {
  rules: PrimaryBidRuleScheduleRule[];

  constructor(rules: PrimaryBidRuleScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryBidRuleSchedule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryBidRuleSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryBidRuleSchedule[]): Map<string, string[]> {
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

export function defaultPrimaryBidRuleScheduleValidator(): PrimaryBidRuleScheduleValidator {
  return new PrimaryBidRuleScheduleValidator(
    [
      new PrimaryBidRuleScheduleCodePrefixRule("REF"),
      new PrimaryBidRuleScheduleRequiredCodeRule("primary bid rule schedule needs an entry"),
      new PrimaryBidRuleScheduleCostRangeRule(2, 2424),
      new PrimaryBidRuleScheduleRequiredCurrencyRule("primary bid rule schedule needs this field"),
    ],
  );
}
