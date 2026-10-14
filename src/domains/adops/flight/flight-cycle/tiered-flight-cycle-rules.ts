import { TieredFlightCycle } from "./tiered-flight-cycle.js";

/** A rule a tiered flight cycle must pass. Check returns its problems, or none. */
export interface TieredFlightCycleRule {
  check(item: TieredFlightCycle): string[];
}

export class TieredFlightCycleWindowDaysRangeRule implements TieredFlightCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredFlightCycle): string[] {
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

export class TieredFlightCycleRequiredCodeRule implements TieredFlightCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredFlightCycle): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TieredFlightCycleTitleLengthRule implements TieredFlightCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredFlightCycle): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredFlightCycleSendAtRangeRule implements TieredFlightCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredFlightCycle): string[] {
    const value = item.sendAt;
    if (value < this.min || value > this.max) return [`send at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredFlightCycleNameLengthRule implements TieredFlightCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredFlightCycle): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredFlightCycleRequiredNameRule implements TieredFlightCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredFlightCycle): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a tiered flight cycle. */
export class TieredFlightCycleValidator {
  rules: TieredFlightCycleRule[];

  constructor(rules: TieredFlightCycleRule[]) {
    this.rules = rules;
  }

  validate(item: TieredFlightCycle): string[] {
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

  requireValid(item: TieredFlightCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredFlightCycle[]): Map<string, string[]> {
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

export function defaultTieredFlightCycleValidator(): TieredFlightCycleValidator {
  return new TieredFlightCycleValidator(
    [
      new TieredFlightCycleWindowDaysRangeRule(255, 1000),
      new TieredFlightCycleRequiredCodeRule("tiered flight cycle needs this field"),
      new TieredFlightCycleTitleLengthRule(1000),
      new TieredFlightCycleSendAtRangeRule(3600, 86400),
      new TieredFlightCycleNameLengthRule(3600),
      new TieredFlightCycleRequiredNameRule("tiered flight cycle needs an entry"),
    ],
  );
}
