import { DeflectionBaseline } from "./deflection-baseline.js";

/** A rule a deflection baseline must pass. Check returns its problems, or none. */
export interface DeflectionBaselineRule {
  check(item: DeflectionBaseline): string[];
}

export class DeflectionBaselineRequiredCodeRule implements DeflectionBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DeflectionBaseline): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class DeflectionBaselineRequiredNameRule implements DeflectionBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DeflectionBaseline): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class DeflectionBaselineNameLengthRule implements DeflectionBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DeflectionBaseline): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DeflectionBaselineRequiredJourneyIdRule implements DeflectionBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DeflectionBaseline): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

export class DeflectionBaselineCodeLengthRule implements DeflectionBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DeflectionBaseline): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DeflectionBaselineSequenceRangeRule implements DeflectionBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DeflectionBaseline): string[] {
    const value = item.sequence;
    if (value < this.min || value > this.max) return [`sequence ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a deflection baseline. */
export class DeflectionBaselineValidator {
  rules: DeflectionBaselineRule[];

  constructor(rules: DeflectionBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: DeflectionBaseline): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DeflectionBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DeflectionBaseline[]): Map<string, string[]> {
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

export function defaultDeflectionBaselineValidator(): DeflectionBaselineValidator {
  return new DeflectionBaselineValidator(
    [
      new DeflectionBaselineRequiredCodeRule("deflection baseline needs a value"),
      new DeflectionBaselineRequiredNameRule("deflection baseline needs this field"),
      new DeflectionBaselineNameLengthRule(16),
      new DeflectionBaselineRequiredJourneyIdRule("deflection baseline needs this field"),
      new DeflectionBaselineCodeLengthRule(255),
      new DeflectionBaselineSequenceRangeRule(3600, 3600),
    ],
  );
}
