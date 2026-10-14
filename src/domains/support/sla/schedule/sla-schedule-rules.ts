import { SlaSchedule } from "./sla-schedule.js";

/** A rule a sla schedule must pass. Check returns its problems, or none. */
export interface SlaScheduleRule {
  check(item: SlaSchedule): string[];
}

export class SlaScheduleImpressionsRangeRule implements SlaScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SlaSchedule): string[] {
    const value = item.impressions;
    if (value < this.min || value > this.max) return [`impressions ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SlaScheduleRequiredUnitRule implements SlaScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SlaSchedule): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

export class SlaScheduleMinimumRangeRule implements SlaScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SlaSchedule): string[] {
    const value = item.minimum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`minimum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`minimum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SlaScheduleNameLengthRule implements SlaScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SlaSchedule): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a sla schedule. */
export class SlaScheduleValidator {
  rules: SlaScheduleRule[];

  constructor(rules: SlaScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: SlaSchedule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SlaSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SlaSchedule[]): Map<string, string[]> {
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

export function defaultSlaScheduleValidator(): SlaScheduleValidator {
  return new SlaScheduleValidator(
    [
      new SlaScheduleImpressionsRangeRule(80, 120),
      new SlaScheduleRequiredUnitRule("sla schedule needs this field"),
      new SlaScheduleMinimumRangeRule(2.7, 3738.6),
      new SlaScheduleNameLengthRule(255),
    ],
  );
}
