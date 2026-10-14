import * as text from "../../../../kit/text.js";
import { PostSchedule } from "./post-schedule.js";

/** A rule a post schedule must pass. Check returns its problems, or none. */
export interface PostScheduleRule {
  check(item: PostSchedule): string[];
}

export class PostScheduleWindowDaysRangeRule implements PostScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PostSchedule): string[] {
    const value = item.windowDays;
    if (value < this.min || value > this.max) return [`window days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PostScheduleCodePrefixRule implements PostScheduleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PostSchedule): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PostScheduleAllowedNameRule implements PostScheduleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PostSchedule): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is duplicated`];
    return [];
  }
}

/** Runs every rule of a post schedule. */
export class PostScheduleValidator {
  rules: PostScheduleRule[];

  constructor(rules: PostScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: PostSchedule): string[] {
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

  requireValid(item: PostSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PostSchedule[]): Map<string, string[]> {
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

export function defaultPostScheduleValidator(): PostScheduleValidator {
  return new PostScheduleValidator(
    [
      new PostScheduleWindowDaysRangeRule(80, 1000),
      new PostScheduleCodePrefixRule("ACM"),
      new PostScheduleAllowedNameRule(["seasonal"]),
    ],
  );
}
