import { NudgeSchedule } from "./nudge-schedule.js";

/** A rule a nudge schedule must pass. Check returns its problems, or none. */
export interface NudgeScheduleRule {
  check(item: NudgeSchedule): string[];
}

export class NudgeScheduleLabelLengthRule implements NudgeScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: NudgeSchedule): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class NudgeScheduleCountryLengthRule implements NudgeScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: NudgeSchedule): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class NudgeScheduleRequiredCountryRule implements NudgeScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: NudgeSchedule): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a nudge schedule. */
export class NudgeScheduleValidator {
  rules: NudgeScheduleRule[];

  constructor(rules: NudgeScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: NudgeSchedule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: NudgeSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: NudgeSchedule[]): Map<string, string[]> {
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

export function defaultNudgeScheduleValidator(): NudgeScheduleValidator {
  return new NudgeScheduleValidator(
    [
      new NudgeScheduleLabelLengthRule(64),
      new NudgeScheduleCountryLengthRule(32),
      new NudgeScheduleRequiredCountryRule("nudge schedule needs a value"),
    ],
  );
}
