import * as text from "../../../../kit/text.js";
import { DeflectionSchedule } from "./deflection-schedule.js";

/** A rule a deflection schedule must pass. Check returns its problems, or none. */
export interface DeflectionScheduleRule {
  check(item: DeflectionSchedule): string[];
}

export class DeflectionScheduleRequiredCodeRule implements DeflectionScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DeflectionSchedule): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class DeflectionScheduleCodeLengthRule implements DeflectionScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DeflectionSchedule): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DeflectionScheduleWindowDaysRangeRule implements DeflectionScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DeflectionSchedule): string[] {
    const value = item.windowDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`window days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`window days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DeflectionScheduleAllowedTitleRule implements DeflectionScheduleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DeflectionSchedule): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is below minimum`];
    return [];
  }
}

export class DeflectionScheduleCodePrefixRule implements DeflectionScheduleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DeflectionSchedule): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class DeflectionScheduleRequiredTitleRule implements DeflectionScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DeflectionSchedule): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a deflection schedule. */
export class DeflectionScheduleValidator {
  rules: DeflectionScheduleRule[];

  constructor(rules: DeflectionScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: DeflectionSchedule): string[] {
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

  requireValid(item: DeflectionSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DeflectionSchedule[]): Map<string, string[]> {
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

export function defaultDeflectionScheduleValidator(): DeflectionScheduleValidator {
  return new DeflectionScheduleValidator(
    [
      new DeflectionScheduleRequiredCodeRule("deflection schedule needs an entry"),
      new DeflectionScheduleCodeLengthRule(80),
      new DeflectionScheduleWindowDaysRangeRule(1000, 3600),
      new DeflectionScheduleAllowedTitleRule(["primary"]),
      new DeflectionScheduleCodePrefixRule("X"),
      new DeflectionScheduleRequiredTitleRule("deflection schedule needs a value"),
    ],
  );
}
