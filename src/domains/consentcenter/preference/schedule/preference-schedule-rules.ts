import { PreferenceSchedule } from "./preference-schedule.js";

/** A rule a preference schedule must pass. Check returns its problems, or none. */
export interface PreferenceScheduleRule {
  check(item: PreferenceSchedule): string[];
}

export class PreferenceScheduleNotesLengthRule implements PreferenceScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PreferenceSchedule): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PreferenceScheduleCodeLengthRule implements PreferenceScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PreferenceSchedule): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PreferenceScheduleRequiredNotesRule implements PreferenceScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PreferenceSchedule): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

export class PreferenceScheduleLimitRangeRule implements PreferenceScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PreferenceSchedule): string[] {
    const value = item.limit;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`limit ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`limit ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a preference schedule. */
export class PreferenceScheduleValidator {
  rules: PreferenceScheduleRule[];

  constructor(rules: PreferenceScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: PreferenceSchedule): string[] {
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

  requireValid(item: PreferenceSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PreferenceSchedule[]): Map<string, string[]> {
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

export function defaultPreferenceScheduleValidator(): PreferenceScheduleValidator {
  return new PreferenceScheduleValidator(
    [
      new PreferenceScheduleNotesLengthRule(32),
      new PreferenceScheduleCodeLengthRule(120),
      new PreferenceScheduleRequiredNotesRule("preference schedule needs a value"),
      new PreferenceScheduleLimitRangeRule(3600, 86400),
    ],
  );
}
