import { WeightedPreferenceException } from "./weighted-preference-exception.js";

/** A rule a weighted preference exception must pass. Check returns its problems, or none. */
export interface WeightedPreferenceExceptionRule {
  check(item: WeightedPreferenceException): string[];
}

export class WeightedPreferenceExceptionRequiredCodeRule implements WeightedPreferenceExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedPreferenceException): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedPreferenceExceptionRequiredExternalRefRule implements WeightedPreferenceExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedPreferenceException): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedPreferenceExceptionExternalRefLengthRule implements WeightedPreferenceExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedPreferenceException): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a weighted preference exception. */
export class WeightedPreferenceExceptionValidator {
  rules: WeightedPreferenceExceptionRule[];

  constructor(rules: WeightedPreferenceExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedPreferenceException): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedPreferenceException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedPreferenceException[]): Map<string, string[]> {
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

export function defaultWeightedPreferenceExceptionValidator(): WeightedPreferenceExceptionValidator {
  return new WeightedPreferenceExceptionValidator(
    [
      new WeightedPreferenceExceptionRequiredCodeRule("weighted preference exception needs a value"),
      new WeightedPreferenceExceptionRequiredExternalRefRule("weighted preference exception needs an entry"),
      new WeightedPreferenceExceptionExternalRefLengthRule(120),
    ],
  );
}
