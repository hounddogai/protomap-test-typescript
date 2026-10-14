import { TieredSubscriptionSchedule } from "./tiered-subscription-schedule.js";

/** A rule a tiered subscription schedule must pass. Check returns its problems, or none. */
export interface TieredSubscriptionScheduleRule {
  check(item: TieredSubscriptionSchedule): string[];
}

export class TieredSubscriptionScheduleRequiredTimezoneRule implements TieredSubscriptionScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredSubscriptionSchedule): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class TieredSubscriptionScheduleDiscountRangeRule implements TieredSubscriptionScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredSubscriptionSchedule): string[] {
    const value = item.discount;
    if (value < this.min || value > this.max) return [`discount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredSubscriptionScheduleFrequencyCapRangeRule implements TieredSubscriptionScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredSubscriptionSchedule): string[] {
    const value = item.frequencyCap;
    if (value < this.min || value > this.max) return [`frequency cap ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredSubscriptionScheduleMarginRangeRule implements TieredSubscriptionScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredSubscriptionSchedule): string[] {
    const value = item.margin;
    if (value < this.min || value > this.max) return [`margin ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredSubscriptionScheduleTimezoneLengthRule implements TieredSubscriptionScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredSubscriptionSchedule): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a tiered subscription schedule. */
export class TieredSubscriptionScheduleValidator {
  rules: TieredSubscriptionScheduleRule[];

  constructor(rules: TieredSubscriptionScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: TieredSubscriptionSchedule): string[] {
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

  requireValid(item: TieredSubscriptionSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredSubscriptionSchedule[]): Map<string, string[]> {
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

export function defaultTieredSubscriptionScheduleValidator(): TieredSubscriptionScheduleValidator {
  return new TieredSubscriptionScheduleValidator(
    [
      new TieredSubscriptionScheduleRequiredTimezoneRule("tiered subscription schedule needs an entry"),
      new TieredSubscriptionScheduleDiscountRangeRule(3.8, 108.5),
      new TieredSubscriptionScheduleFrequencyCapRangeRule(80, 120),
      new TieredSubscriptionScheduleMarginRangeRule(6.7, 2062.9),
      new TieredSubscriptionScheduleTimezoneLengthRule(32),
    ],
  );
}
