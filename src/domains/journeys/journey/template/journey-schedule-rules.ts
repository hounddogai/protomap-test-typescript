import { JourneySchedule } from "./journey-schedule.js";

/** A rule a journey schedule must pass. Check returns its problems, or none. */
export interface JourneyScheduleRule {
  check(item: JourneySchedule): string[];
}

export class JourneyScheduleUpdatedAtRangeRule implements JourneyScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: JourneySchedule): string[] {
    const value = item.updatedAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`updated at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`updated at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class JourneyScheduleRequiredRegionRule implements JourneyScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: JourneySchedule): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

export class JourneyScheduleRequiredCodeRule implements JourneyScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: JourneySchedule): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a journey schedule. */
export class JourneyScheduleValidator {
  rules: JourneyScheduleRule[];

  constructor(rules: JourneyScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: JourneySchedule): string[] {
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

  requireValid(item: JourneySchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: JourneySchedule[]): Map<string, string[]> {
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

export function defaultJourneyScheduleValidator(): JourneyScheduleValidator {
  return new JourneyScheduleValidator(
    [
      new JourneyScheduleUpdatedAtRangeRule(64, 86400),
      new JourneyScheduleRequiredRegionRule("journey schedule needs this field"),
      new JourneyScheduleRequiredCodeRule("journey schedule needs an entry"),
    ],
  );
}
