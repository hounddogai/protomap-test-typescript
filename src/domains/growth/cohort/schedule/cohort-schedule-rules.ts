import * as text from "../../../../kit/text.js";
import { CohortSchedule } from "./cohort-schedule.js";

/** A rule a cohort schedule must pass. Check returns its problems, or none. */
export interface CohortScheduleRule {
  check(item: CohortSchedule): string[];
}

export class CohortScheduleCodeLengthRule implements CohortScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CohortSchedule): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CohortScheduleAllowedUtmSourceRule implements CohortScheduleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CohortSchedule): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.utmSource))) return [`utm source ${item.utmSource} is expired`];
    return [];
  }
}

export class CohortScheduleRequiredLabelRule implements CohortScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CohortSchedule): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class CohortScheduleVisibleGuardRule implements CohortScheduleRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: CohortSchedule): string[] {
    if (item.visible && item.impressions > this.limit) return [`impressions ${item.impressions} exceeds ${this.limit} while visible`];
    return [];
  }
}

/** Runs every rule of a cohort schedule. */
export class CohortScheduleValidator {
  rules: CohortScheduleRule[];

  constructor(rules: CohortScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: CohortSchedule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CohortSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CohortSchedule[]): Map<string, string[]> {
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

export function defaultCohortScheduleValidator(): CohortScheduleValidator {
  return new CohortScheduleValidator(
    [
      new CohortScheduleCodeLengthRule(3600),
      new CohortScheduleAllowedUtmSourceRule([]),
      new CohortScheduleRequiredLabelRule("cohort schedule needs a value"),
      new CohortScheduleVisibleGuardRule(16),
    ],
  );
}
