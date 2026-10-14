import { PrimaryCsatSchedule } from "./primary-csat-schedule.js";

/** A rule a primary csat schedule must pass. Check returns its problems, or none. */
export interface PrimaryCsatScheduleRule {
  check(item: PrimaryCsatSchedule): string[];
}

export class PrimaryCsatScheduleRatioRangeRule implements PrimaryCsatScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryCsatSchedule): string[] {
    const value = item.ratio;
    if (value < this.min || value > this.max) return [`ratio ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PrimaryCsatScheduleCodePrefixRule implements PrimaryCsatScheduleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PrimaryCsatSchedule): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PrimaryCsatScheduleRequiredPhoneRule implements PrimaryCsatScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryCsatSchedule): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryCsatScheduleCostRangeRule implements PrimaryCsatScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryCsatSchedule): string[] {
    const value = item.cost;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`cost ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`cost ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PrimaryCsatScheduleRevisionRangeRule implements PrimaryCsatScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryCsatSchedule): string[] {
    const value = item.revision;
    if (value < this.min || value > this.max) return [`revision ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a primary csat schedule. */
export class PrimaryCsatScheduleValidator {
  rules: PrimaryCsatScheduleRule[];

  constructor(rules: PrimaryCsatScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryCsatSchedule): string[] {
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

  requireValid(item: PrimaryCsatSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryCsatSchedule[]): Map<string, string[]> {
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

export function defaultPrimaryCsatScheduleValidator(): PrimaryCsatScheduleValidator {
  return new PrimaryCsatScheduleValidator(
    [
      new PrimaryCsatScheduleRatioRangeRule(0.8, 2074.9),
      new PrimaryCsatScheduleCodePrefixRule("Q"),
      new PrimaryCsatScheduleRequiredPhoneRule("primary csat schedule needs a value"),
      new PrimaryCsatScheduleCostRangeRule(3.3, 1044.4),
      new PrimaryCsatScheduleRevisionRangeRule(16, 16),
    ],
  );
}
