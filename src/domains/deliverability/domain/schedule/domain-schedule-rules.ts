import { DomainSchedule } from "./domain-schedule.js";

/** A rule a domain schedule must pass. Check returns its problems, or none. */
export interface DomainScheduleRule {
  check(item: DomainSchedule): string[];
}

export class DomainScheduleMaximumRangeRule implements DomainScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DomainSchedule): string[] {
    const value = item.maximum;
    if (value < this.min || value > this.max) return [`maximum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DomainScheduleLabelLengthRule implements DomainScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DomainSchedule): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DomainScheduleRequiredLocaleRule implements DomainScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DomainSchedule): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class DomainScheduleUtmSourceLengthRule implements DomainScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DomainSchedule): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a domain schedule. */
export class DomainScheduleValidator {
  rules: DomainScheduleRule[];

  constructor(rules: DomainScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: DomainSchedule): string[] {
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

  requireValid(item: DomainSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DomainSchedule[]): Map<string, string[]> {
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

export function defaultDomainScheduleValidator(): DomainScheduleValidator {
  return new DomainScheduleValidator(
    [
      new DomainScheduleMaximumRangeRule(1, 1863.3),
      new DomainScheduleLabelLengthRule(80),
      new DomainScheduleRequiredLocaleRule("domain schedule needs this field"),
      new DomainScheduleUtmSourceLengthRule(16),
    ],
  );
}
