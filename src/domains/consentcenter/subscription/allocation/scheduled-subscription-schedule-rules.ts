import { ScheduledSubscriptionSchedule } from "./scheduled-subscription-schedule.js";

/** A rule a scheduled subscription schedule must pass. Check returns its problems, or none. */
export interface ScheduledSubscriptionScheduleRule {
  check(item: ScheduledSubscriptionSchedule): string[];
}

export class ScheduledSubscriptionScheduleCodeLengthRule implements ScheduledSubscriptionScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledSubscriptionSchedule): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledSubscriptionScheduleContactEmailLengthRule implements ScheduledSubscriptionScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledSubscriptionSchedule): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledSubscriptionScheduleRequiredTitleRule implements ScheduledSubscriptionScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledSubscriptionSchedule): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledSubscriptionScheduleCapacityRangeRule implements ScheduledSubscriptionScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledSubscriptionSchedule): string[] {
    const value = item.capacity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`capacity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`capacity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ScheduledSubscriptionScheduleCodePrefixRule implements ScheduledSubscriptionScheduleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ScheduledSubscriptionSchedule): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ScheduledSubscriptionScheduleRequiredCodeRule implements ScheduledSubscriptionScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledSubscriptionSchedule): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a scheduled subscription schedule. */
export class ScheduledSubscriptionScheduleValidator {
  rules: ScheduledSubscriptionScheduleRule[];

  constructor(rules: ScheduledSubscriptionScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledSubscriptionSchedule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ScheduledSubscriptionSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledSubscriptionSchedule[]): Map<string, string[]> {
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

export function defaultScheduledSubscriptionScheduleValidator(): ScheduledSubscriptionScheduleValidator {
  return new ScheduledSubscriptionScheduleValidator(
    [
      new ScheduledSubscriptionScheduleCodeLengthRule(64),
      new ScheduledSubscriptionScheduleContactEmailLengthRule(1000),
      new ScheduledSubscriptionScheduleRequiredTitleRule("scheduled subscription schedule needs this field"),
      new ScheduledSubscriptionScheduleCapacityRangeRule(16, 1000),
      new ScheduledSubscriptionScheduleCodePrefixRule("ACM"),
      new ScheduledSubscriptionScheduleRequiredCodeRule("scheduled subscription schedule needs this field"),
    ],
  );
}
