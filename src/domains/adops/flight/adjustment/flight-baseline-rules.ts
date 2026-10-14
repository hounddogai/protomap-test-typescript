import { FlightBaseline } from "./flight-baseline.js";

/** A rule a flight baseline must pass. Check returns its problems, or none. */
export interface FlightBaselineRule {
  check(item: FlightBaseline): string[];
}

export class FlightBaselineRatioRangeRule implements FlightBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FlightBaseline): string[] {
    const value = item.ratio;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ratio ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ratio ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FlightBaselineRequiredCodeRule implements FlightBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FlightBaseline): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class FlightBaselineScoreRangeRule implements FlightBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FlightBaseline): string[] {
    const value = item.score;
    if (value < this.min || value > this.max) return [`score ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FlightBaselineRateRangeRule implements FlightBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FlightBaseline): string[] {
    const value = item.rate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a flight baseline. */
export class FlightBaselineValidator {
  rules: FlightBaselineRule[];

  constructor(rules: FlightBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: FlightBaseline): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FlightBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FlightBaseline[]): Map<string, string[]> {
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

export function defaultFlightBaselineValidator(): FlightBaselineValidator {
  return new FlightBaselineValidator(
    [
      new FlightBaselineRatioRangeRule(6.5, 765.9),
      new FlightBaselineRequiredCodeRule("flight baseline needs this field"),
      new FlightBaselineScoreRangeRule(9.4, 1614.4),
      new FlightBaselineRateRangeRule(8.8, 2847.8),
    ],
  );
}
