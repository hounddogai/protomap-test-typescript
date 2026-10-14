import { FlightVariance } from "./flight-variance.js";

/** A rule a flight variance must pass. Check returns its problems, or none. */
export interface FlightVarianceRule {
  check(item: FlightVariance): string[];
}

export class FlightVariancePriorityRangeRule implements FlightVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FlightVariance): string[] {
    const value = item.priority;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`priority ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`priority ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FlightVarianceRequiredCodeRule implements FlightVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FlightVariance): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class FlightVarianceCodeLengthRule implements FlightVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FlightVariance): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FlightVarianceCodePrefixRule implements FlightVarianceRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FlightVariance): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FlightVarianceCategoryLengthRule implements FlightVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FlightVariance): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a flight variance. */
export class FlightVarianceValidator {
  rules: FlightVarianceRule[];

  constructor(rules: FlightVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: FlightVariance): string[] {
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

  requireValid(item: FlightVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FlightVariance[]): Map<string, string[]> {
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

export function defaultFlightVarianceValidator(): FlightVarianceValidator {
  return new FlightVarianceValidator(
    [
      new FlightVariancePriorityRangeRule(1000, 3600),
      new FlightVarianceRequiredCodeRule("flight variance needs this field"),
      new FlightVarianceCodeLengthRule(80),
      new FlightVarianceCodePrefixRule("X"),
      new FlightVarianceCategoryLengthRule(32),
    ],
  );
}
