import { WeightedOptOutProfile } from "./weighted-opt-out-profile.js";

/** A rule a weighted opt out profile must pass. Check returns its problems, or none. */
export interface WeightedOptOutProfileRule {
  check(item: WeightedOptOutProfile): string[];
}

export class WeightedOptOutProfileNotesLengthRule implements WeightedOptOutProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedOptOutProfile): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedOptOutProfileLabelLengthRule implements WeightedOptOutProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedOptOutProfile): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedOptOutProfileRequiredCodeRule implements WeightedOptOutProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedOptOutProfile): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedOptOutProfileRequiredLocaleRule implements WeightedOptOutProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedOptOutProfile): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a weighted opt out profile. */
export class WeightedOptOutProfileValidator {
  rules: WeightedOptOutProfileRule[];

  constructor(rules: WeightedOptOutProfileRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedOptOutProfile): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedOptOutProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedOptOutProfile[]): Map<string, string[]> {
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

export function defaultWeightedOptOutProfileValidator(): WeightedOptOutProfileValidator {
  return new WeightedOptOutProfileValidator(
    [
      new WeightedOptOutProfileNotesLengthRule(3600),
      new WeightedOptOutProfileLabelLengthRule(1000),
      new WeightedOptOutProfileRequiredCodeRule("weighted opt out profile needs an entry"),
      new WeightedOptOutProfileRequiredLocaleRule("weighted opt out profile needs a value"),
    ],
  );
}
