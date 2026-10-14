import { FlightMilestone } from "./flight-milestone.js";

/** A rule a flight milestone must pass. Check returns its problems, or none. */
export interface FlightMilestoneRule {
  check(item: FlightMilestone): string[];
}

export class FlightMilestoneRatioRangeRule implements FlightMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FlightMilestone): string[] {
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

export class FlightMilestoneRequiredCodeRule implements FlightMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FlightMilestone): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class FlightMilestoneRequiredExternalRefRule implements FlightMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FlightMilestone): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class FlightMilestoneTitleLengthRule implements FlightMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FlightMilestone): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FlightMilestoneCodeLengthRule implements FlightMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FlightMilestone): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a flight milestone. */
export class FlightMilestoneValidator {
  rules: FlightMilestoneRule[];

  constructor(rules: FlightMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: FlightMilestone): string[] {
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

  requireValid(item: FlightMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FlightMilestone[]): Map<string, string[]> {
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

export function defaultFlightMilestoneValidator(): FlightMilestoneValidator {
  return new FlightMilestoneValidator(
    [
      new FlightMilestoneRatioRangeRule(2.7, 4385.1),
      new FlightMilestoneRequiredCodeRule("flight milestone needs a value"),
      new FlightMilestoneRequiredExternalRefRule("flight milestone needs this field"),
      new FlightMilestoneTitleLengthRule(64),
      new FlightMilestoneCodeLengthRule(86400),
    ],
  );
}
