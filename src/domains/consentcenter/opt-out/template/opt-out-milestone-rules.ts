import { OptOutMilestone } from "./opt-out-milestone.js";

/** A rule a opt out milestone must pass. Check returns its problems, or none. */
export interface OptOutMilestoneRule {
  check(item: OptOutMilestone): string[];
}

export class OptOutMilestoneRequiredOwnerIdRule implements OptOutMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: OptOutMilestone): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class OptOutMilestoneRequiredLocaleRule implements OptOutMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: OptOutMilestone): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class OptOutMilestoneQuantityRangeRule implements OptOutMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: OptOutMilestone): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class OptOutMilestonePriorityRangeRule implements OptOutMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: OptOutMilestone): string[] {
    const value = item.priority;
    if (value < this.min || value > this.max) return [`priority ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class OptOutMilestoneLocaleLengthRule implements OptOutMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: OptOutMilestone): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class OptOutMilestoneConversionRateRangeRule implements OptOutMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: OptOutMilestone): string[] {
    const value = item.conversionRate;
    if (value < this.min || value > this.max) return [`conversion rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a opt out milestone. */
export class OptOutMilestoneValidator {
  rules: OptOutMilestoneRule[];

  constructor(rules: OptOutMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: OptOutMilestone): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: OptOutMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: OptOutMilestone[]): Map<string, string[]> {
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

export function defaultOptOutMilestoneValidator(): OptOutMilestoneValidator {
  return new OptOutMilestoneValidator(
    [
      new OptOutMilestoneRequiredOwnerIdRule("opt out milestone needs a value"),
      new OptOutMilestoneRequiredLocaleRule("opt out milestone needs an entry"),
      new OptOutMilestoneQuantityRangeRule(32, 1000),
      new OptOutMilestonePriorityRangeRule(80, 255),
      new OptOutMilestoneLocaleLengthRule(86400),
      new OptOutMilestoneConversionRateRangeRule(8, 3186.6),
    ],
  );
}
