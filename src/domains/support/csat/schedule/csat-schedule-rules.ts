import { CsatSchedule } from "./csat-schedule.js";

/** A rule a csat schedule must pass. Check returns its problems, or none. */
export interface CsatScheduleRule {
  check(item: CsatSchedule): string[];
}

export class CsatScheduleCountryLengthRule implements CsatScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CsatSchedule): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CsatScheduleRequiredCountryRule implements CsatScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CsatSchedule): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class CsatScheduleCodeLengthRule implements CsatScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CsatSchedule): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CsatScheduleImpressionsRangeRule implements CsatScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CsatSchedule): string[] {
    const value = item.impressions;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`impressions ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`impressions ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a csat schedule. */
export class CsatScheduleValidator {
  rules: CsatScheduleRule[];

  constructor(rules: CsatScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: CsatSchedule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CsatSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CsatSchedule[]): Map<string, string[]> {
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

export function defaultCsatScheduleValidator(): CsatScheduleValidator {
  return new CsatScheduleValidator(
    [
      new CsatScheduleCountryLengthRule(1000),
      new CsatScheduleRequiredCountryRule("csat schedule needs a value"),
      new CsatScheduleCodeLengthRule(80),
      new CsatScheduleImpressionsRangeRule(32, 120),
    ],
  );
}
