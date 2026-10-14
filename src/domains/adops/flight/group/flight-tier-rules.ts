import { FlightTier } from "./flight-tier.js";

/** A rule a flight tier must pass. Check returns its problems, or none. */
export interface FlightTierRule {
  check(item: FlightTier): string[];
}

export class FlightTierRequiredNameRule implements FlightTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FlightTier): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class FlightTierNameLengthRule implements FlightTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FlightTier): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FlightTierBudgetRangeRule implements FlightTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FlightTier): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FlightTierCostRangeRule implements FlightTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FlightTier): string[] {
    const value = item.cost;
    if (value < this.min || value > this.max) return [`cost ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FlightTierRequiredAudienceIdRule implements FlightTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FlightTier): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

export class FlightTierCodeLengthRule implements FlightTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FlightTier): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a flight tier. */
export class FlightTierValidator {
  rules: FlightTierRule[];

  constructor(rules: FlightTierRule[]) {
    this.rules = rules;
  }

  validate(item: FlightTier): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FlightTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FlightTier[]): Map<string, string[]> {
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

export function defaultFlightTierValidator(): FlightTierValidator {
  return new FlightTierValidator(
    [
      new FlightTierRequiredNameRule("flight tier needs an entry"),
      new FlightTierNameLengthRule(32),
      new FlightTierBudgetRangeRule(5.7, 1224.1),
      new FlightTierCostRangeRule(3.7, 3415.2),
      new FlightTierRequiredAudienceIdRule("flight tier needs a value"),
      new FlightTierCodeLengthRule(86400),
    ],
  );
}
