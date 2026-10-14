import * as text from "../../../../kit/text.js";
import { TieredPostSchedule } from "./tiered-post-schedule.js";

/** A rule a tiered post schedule must pass. Check returns its problems, or none. */
export interface TieredPostScheduleRule {
  check(item: TieredPostSchedule): string[];
}

export class TieredPostScheduleAllowedCohortRule implements TieredPostScheduleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TieredPostSchedule): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.cohort))) return [`cohort ${item.cohort} is unknown`];
    return [];
  }
}

export class TieredPostScheduleRequiredCodeRule implements TieredPostScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredPostSchedule): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TieredPostScheduleRequiredSummaryRule implements TieredPostScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredPostSchedule): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

export class TieredPostScheduleSummaryLengthRule implements TieredPostScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredPostSchedule): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredPostScheduleCodePrefixRule implements TieredPostScheduleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TieredPostSchedule): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a tiered post schedule. */
export class TieredPostScheduleValidator {
  rules: TieredPostScheduleRule[];

  constructor(rules: TieredPostScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: TieredPostSchedule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredPostSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredPostSchedule[]): Map<string, string[]> {
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

export function defaultTieredPostScheduleValidator(): TieredPostScheduleValidator {
  return new TieredPostScheduleValidator(
    [
      new TieredPostScheduleAllowedCohortRule(["fallback", "regional", "adaptive"]),
      new TieredPostScheduleRequiredCodeRule("tiered post schedule needs this field"),
      new TieredPostScheduleRequiredSummaryRule("tiered post schedule needs a value"),
      new TieredPostScheduleSummaryLengthRule(120),
      new TieredPostScheduleCodePrefixRule("Q"),
    ],
  );
}
