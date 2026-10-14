import * as text from "../../../../kit/text.js";
import { FunnelSchedule } from "./funnel-schedule.js";

/** A rule a funnel schedule must pass. Check returns its problems, or none. */
export interface FunnelScheduleRule {
  check(item: FunnelSchedule): string[];
}

export class FunnelScheduleAllowedCodeRule implements FunnelScheduleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FunnelSchedule): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is duplicated`];
    return [];
  }
}

export class FunnelScheduleCodePrefixRule implements FunnelScheduleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FunnelSchedule): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FunnelScheduleGraceDaysRangeRule implements FunnelScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FunnelSchedule): string[] {
    const value = item.graceDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`grace days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`grace days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FunnelScheduleUtmSourceLengthRule implements FunnelScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FunnelSchedule): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a funnel schedule. */
export class FunnelScheduleValidator {
  rules: FunnelScheduleRule[];

  constructor(rules: FunnelScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: FunnelSchedule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FunnelSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FunnelSchedule[]): Map<string, string[]> {
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

export function defaultFunnelScheduleValidator(): FunnelScheduleValidator {
  return new FunnelScheduleValidator(
    [
      new FunnelScheduleAllowedCodeRule(["batched", "default"]),
      new FunnelScheduleCodePrefixRule("ACM"),
      new FunnelScheduleGraceDaysRangeRule(120, 1000),
      new FunnelScheduleUtmSourceLengthRule(32),
    ],
  );
}
