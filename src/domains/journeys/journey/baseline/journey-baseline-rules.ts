import { JourneyBaseline } from "./journey-baseline.js";

/** A rule a journey baseline must pass. Check returns its problems, or none. */
export interface JourneyBaselineRule {
  check(item: JourneyBaseline): string[];
}

export class JourneyBaselineNameLengthRule implements JourneyBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: JourneyBaseline): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class JourneyBaselineLimitRangeRule implements JourneyBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: JourneyBaseline): string[] {
    const value = item.limit;
    if (value < this.min || value > this.max) return [`limit ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class JourneyBaselineFrequencyCapRangeRule implements JourneyBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: JourneyBaseline): string[] {
    const value = item.frequencyCap;
    if (value < this.min || value > this.max) return [`frequency cap ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class JourneyBaselineRequiredSourceRule implements JourneyBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: JourneyBaseline): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

export class JourneyBaselineRequiredCodeRule implements JourneyBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: JourneyBaseline): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class JourneyBaselineStartsAtRangeRule implements JourneyBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: JourneyBaseline): string[] {
    const value = item.startsAt;
    if (value < this.min || value > this.max) return [`starts at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a journey baseline. */
export class JourneyBaselineValidator {
  rules: JourneyBaselineRule[];

  constructor(rules: JourneyBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: JourneyBaseline): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: JourneyBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: JourneyBaseline[]): Map<string, string[]> {
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

export function defaultJourneyBaselineValidator(): JourneyBaselineValidator {
  return new JourneyBaselineValidator(
    [
      new JourneyBaselineNameLengthRule(80),
      new JourneyBaselineLimitRangeRule(80, 80),
      new JourneyBaselineFrequencyCapRangeRule(80, 3600),
      new JourneyBaselineRequiredSourceRule("journey baseline needs an entry"),
      new JourneyBaselineRequiredCodeRule("journey baseline needs an entry"),
      new JourneyBaselineStartsAtRangeRule(64, 120),
    ],
  );
}
