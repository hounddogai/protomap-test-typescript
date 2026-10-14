import { RedemptionSchedule } from "./redemption-schedule.js";

/** A rule a redemption schedule must pass. Check returns its problems, or none. */
export interface RedemptionScheduleRule {
  check(item: RedemptionSchedule): string[];
}

export class RedemptionScheduleRequiredCategoryRule implements RedemptionScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RedemptionSchedule): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

export class RedemptionScheduleRequiredContactEmailRule implements RedemptionScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RedemptionSchedule): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

export class RedemptionScheduleNameLengthRule implements RedemptionScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RedemptionSchedule): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a redemption schedule. */
export class RedemptionScheduleValidator {
  rules: RedemptionScheduleRule[];

  constructor(rules: RedemptionScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: RedemptionSchedule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RedemptionSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RedemptionSchedule[]): Map<string, string[]> {
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

export function defaultRedemptionScheduleValidator(): RedemptionScheduleValidator {
  return new RedemptionScheduleValidator(
    [
      new RedemptionScheduleRequiredCategoryRule("redemption schedule needs a value"),
      new RedemptionScheduleRequiredContactEmailRule("redemption schedule needs an entry"),
      new RedemptionScheduleNameLengthRule(255),
    ],
  );
}
