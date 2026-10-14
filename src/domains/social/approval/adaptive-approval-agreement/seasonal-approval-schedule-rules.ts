import { SeasonalApprovalSchedule } from "./seasonal-approval-schedule.js";

/** A rule a seasonal approval schedule must pass. Check returns its problems, or none. */
export interface SeasonalApprovalScheduleRule {
  check(item: SeasonalApprovalSchedule): string[];
}

export class SeasonalApprovalScheduleRequiredOwnerIdRule implements SeasonalApprovalScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalApprovalSchedule): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalApprovalScheduleRequiredLocaleRule implements SeasonalApprovalScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalApprovalSchedule): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalApprovalScheduleLabelLengthRule implements SeasonalApprovalScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalApprovalSchedule): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalApprovalScheduleRequiredCodeRule implements SeasonalApprovalScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalApprovalSchedule): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a seasonal approval schedule. */
export class SeasonalApprovalScheduleValidator {
  rules: SeasonalApprovalScheduleRule[];

  constructor(rules: SeasonalApprovalScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalApprovalSchedule): string[] {
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

  requireValid(item: SeasonalApprovalSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalApprovalSchedule[]): Map<string, string[]> {
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

export function defaultSeasonalApprovalScheduleValidator(): SeasonalApprovalScheduleValidator {
  return new SeasonalApprovalScheduleValidator(
    [
      new SeasonalApprovalScheduleRequiredOwnerIdRule("seasonal approval schedule needs an entry"),
      new SeasonalApprovalScheduleRequiredLocaleRule("seasonal approval schedule needs an entry"),
      new SeasonalApprovalScheduleLabelLengthRule(1000),
      new SeasonalApprovalScheduleRequiredCodeRule("seasonal approval schedule needs an entry"),
    ],
  );
}
