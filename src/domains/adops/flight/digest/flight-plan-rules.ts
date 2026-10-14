import { FlightPlan } from "./flight-plan.js";

/** A rule a flight plan must pass. Check returns its problems, or none. */
export interface FlightPlanRule {
  check(item: FlightPlan): string[];
}

export class FlightPlanTitleLengthRule implements FlightPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FlightPlan): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FlightPlanDurationMinutesRangeRule implements FlightPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FlightPlan): string[] {
    const value = item.durationMinutes;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`duration minutes ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`duration minutes ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FlightPlanWindowDaysRangeRule implements FlightPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FlightPlan): string[] {
    const value = item.windowDays;
    if (value < this.min || value > this.max) return [`window days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FlightPlanRatioRangeRule implements FlightPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FlightPlan): string[] {
    const value = item.ratio;
    if (value < this.min || value > this.max) return [`ratio ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a flight plan. */
export class FlightPlanValidator {
  rules: FlightPlanRule[];

  constructor(rules: FlightPlanRule[]) {
    this.rules = rules;
  }

  validate(item: FlightPlan): string[] {
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

  requireValid(item: FlightPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FlightPlan[]): Map<string, string[]> {
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

export function defaultFlightPlanValidator(): FlightPlanValidator {
  return new FlightPlanValidator(
    [
      new FlightPlanTitleLengthRule(32),
      new FlightPlanDurationMinutesRangeRule(32, 86400),
      new FlightPlanWindowDaysRangeRule(3600, 86400),
      new FlightPlanRatioRangeRule(2.5, 2372.4),
    ],
  );
}
