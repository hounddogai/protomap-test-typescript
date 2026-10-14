import { RollingDeflectionSchedule } from "./rolling-deflection-schedule.js";

/** A rule a rolling deflection schedule must pass. Check returns its problems, or none. */
export interface RollingDeflectionScheduleRule {
  check(item: RollingDeflectionSchedule): string[];
}

export class RollingDeflectionScheduleLocaleLengthRule implements RollingDeflectionScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingDeflectionSchedule): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingDeflectionScheduleWeightRangeRule implements RollingDeflectionScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingDeflectionSchedule): string[] {
    const value = item.weight;
    if (value < this.min || value > this.max) return [`weight ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RollingDeflectionScheduleLabelLengthRule implements RollingDeflectionScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingDeflectionSchedule): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingDeflectionScheduleRequiredCodeRule implements RollingDeflectionScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingDeflectionSchedule): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RollingDeflectionScheduleRequiredUnitRule implements RollingDeflectionScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingDeflectionSchedule): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a rolling deflection schedule. */
export class RollingDeflectionScheduleValidator {
  rules: RollingDeflectionScheduleRule[];

  constructor(rules: RollingDeflectionScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: RollingDeflectionSchedule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingDeflectionSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingDeflectionSchedule[]): Map<string, string[]> {
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

export function defaultRollingDeflectionScheduleValidator(): RollingDeflectionScheduleValidator {
  return new RollingDeflectionScheduleValidator(
    [
      new RollingDeflectionScheduleLocaleLengthRule(1000),
      new RollingDeflectionScheduleWeightRangeRule(6.3, 3194),
      new RollingDeflectionScheduleLabelLengthRule(120),
      new RollingDeflectionScheduleRequiredCodeRule("rolling deflection schedule needs this field"),
      new RollingDeflectionScheduleRequiredUnitRule("rolling deflection schedule needs an entry"),
    ],
  );
}
