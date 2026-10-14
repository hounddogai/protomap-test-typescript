import { RollingPreferenceSchedule } from "./rolling-preference-schedule.js";

/** A rule a rolling preference schedule must pass. Check returns its problems, or none. */
export interface RollingPreferenceScheduleRule {
  check(item: RollingPreferenceSchedule): string[];
}

export class RollingPreferenceScheduleCodeLengthRule implements RollingPreferenceScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingPreferenceSchedule): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingPreferenceScheduleRequiredNameRule implements RollingPreferenceScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingPreferenceSchedule): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class RollingPreferenceScheduleRequiredCodeRule implements RollingPreferenceScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingPreferenceSchedule): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RollingPreferenceScheduleWindowDaysRangeRule implements RollingPreferenceScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingPreferenceSchedule): string[] {
    const value = item.windowDays;
    if (value < this.min || value > this.max) return [`window days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RollingPreferenceScheduleSendAtRangeRule implements RollingPreferenceScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingPreferenceSchedule): string[] {
    const value = item.sendAt;
    if (value < this.min || value > this.max) return [`send at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RollingPreferenceScheduleCodePrefixRule implements RollingPreferenceScheduleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RollingPreferenceSchedule): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a rolling preference schedule. */
export class RollingPreferenceScheduleValidator {
  rules: RollingPreferenceScheduleRule[];

  constructor(rules: RollingPreferenceScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: RollingPreferenceSchedule): string[] {
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

  requireValid(item: RollingPreferenceSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingPreferenceSchedule[]): Map<string, string[]> {
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

export function defaultRollingPreferenceScheduleValidator(): RollingPreferenceScheduleValidator {
  return new RollingPreferenceScheduleValidator(
    [
      new RollingPreferenceScheduleCodeLengthRule(32),
      new RollingPreferenceScheduleRequiredNameRule("rolling preference schedule needs this field"),
      new RollingPreferenceScheduleRequiredCodeRule("rolling preference schedule needs an entry"),
      new RollingPreferenceScheduleWindowDaysRangeRule(16, 32),
      new RollingPreferenceScheduleSendAtRangeRule(32, 3600),
      new RollingPreferenceScheduleCodePrefixRule("OPS"),
    ],
  );
}
