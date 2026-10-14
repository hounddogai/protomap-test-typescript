import * as text from "../../../../kit/text.js";
import { CappedCohortSchedule } from "./capped-cohort-schedule.js";

/** A rule a capped cohort schedule must pass. Check returns its problems, or none. */
export interface CappedCohortScheduleRule {
  check(item: CappedCohortSchedule): string[];
}

export class CappedCohortScheduleCodePrefixRule implements CappedCohortScheduleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CappedCohortSchedule): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CappedCohortScheduleRequiredCurrencyRule implements CappedCohortScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedCohortSchedule): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

export class CappedCohortScheduleAllowedCohortRule implements CappedCohortScheduleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CappedCohortSchedule): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.cohort))) return [`cohort ${item.cohort} is inconsistent`];
    return [];
  }
}

/** Runs every rule of a capped cohort schedule. */
export class CappedCohortScheduleValidator {
  rules: CappedCohortScheduleRule[];

  constructor(rules: CappedCohortScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: CappedCohortSchedule): string[] {
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

  requireValid(item: CappedCohortSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedCohortSchedule[]): Map<string, string[]> {
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

export function defaultCappedCohortScheduleValidator(): CappedCohortScheduleValidator {
  return new CappedCohortScheduleValidator(
    [
      new CappedCohortScheduleCodePrefixRule("Q"),
      new CappedCohortScheduleRequiredCurrencyRule("capped cohort schedule needs this field"),
      new CappedCohortScheduleAllowedCohortRule(["pending", "weighted", "lenient"]),
    ],
  );
}
