import { PrimaryDomainSchedule } from "./primary-domain-schedule.js";

/** A rule a primary domain schedule must pass. Check returns its problems, or none. */
export interface PrimaryDomainScheduleRule {
  check(item: PrimaryDomainSchedule): string[];
}

export class PrimaryDomainScheduleSequenceRangeRule implements PrimaryDomainScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryDomainSchedule): string[] {
    const value = item.sequence;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`sequence ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`sequence ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PrimaryDomainScheduleRequiredAudienceIdRule implements PrimaryDomainScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryDomainSchedule): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryDomainScheduleAmountRangeRule implements PrimaryDomainScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryDomainSchedule): string[] {
    const value = item.amount;
    if (value < this.min || value > this.max) return [`amount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a primary domain schedule. */
export class PrimaryDomainScheduleValidator {
  rules: PrimaryDomainScheduleRule[];

  constructor(rules: PrimaryDomainScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryDomainSchedule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryDomainSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryDomainSchedule[]): Map<string, string[]> {
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

export function defaultPrimaryDomainScheduleValidator(): PrimaryDomainScheduleValidator {
  return new PrimaryDomainScheduleValidator(
    [
      new PrimaryDomainScheduleSequenceRangeRule(80, 80),
      new PrimaryDomainScheduleRequiredAudienceIdRule("primary domain schedule needs a value"),
      new PrimaryDomainScheduleAmountRangeRule(0.9, 261.3),
    ],
  );
}
