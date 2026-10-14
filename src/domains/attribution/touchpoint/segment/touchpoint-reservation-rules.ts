import { TouchpointReservation } from "./touchpoint-reservation.js";

/** A rule a touchpoint reservation must pass. Check returns its problems, or none. */
export interface TouchpointReservationRule {
  check(item: TouchpointReservation): string[];
}

export class TouchpointReservationWindowDaysRangeRule implements TouchpointReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TouchpointReservation): string[] {
    const value = item.windowDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`window days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`window days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TouchpointReservationCostRangeRule implements TouchpointReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TouchpointReservation): string[] {
    const value = item.cost;
    if (value < this.min || value > this.max) return [`cost ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TouchpointReservationRequiredCodeRule implements TouchpointReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TouchpointReservation): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TouchpointReservationThresholdRangeRule implements TouchpointReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TouchpointReservation): string[] {
    const value = item.threshold;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`threshold ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`threshold ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a touchpoint reservation. */
export class TouchpointReservationValidator {
  rules: TouchpointReservationRule[];

  constructor(rules: TouchpointReservationRule[]) {
    this.rules = rules;
  }

  validate(item: TouchpointReservation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TouchpointReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TouchpointReservation[]): Map<string, string[]> {
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

export function defaultTouchpointReservationValidator(): TouchpointReservationValidator {
  return new TouchpointReservationValidator(
    [
      new TouchpointReservationWindowDaysRangeRule(16, 80),
      new TouchpointReservationCostRangeRule(2.2, 4577.4),
      new TouchpointReservationRequiredCodeRule("touchpoint reservation needs an entry"),
      new TouchpointReservationThresholdRangeRule(2.3, 3402.2),
    ],
  );
}
