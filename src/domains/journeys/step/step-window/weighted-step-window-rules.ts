import { WeightedStepWindow } from "./weighted-step-window.js";

/** A rule a weighted step window must pass. Check returns its problems, or none. */
export interface WeightedStepWindowRule {
  check(item: WeightedStepWindow): string[];
}

export class WeightedStepWindowCodePrefixRule implements WeightedStepWindowRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WeightedStepWindow): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WeightedStepWindowRequiredLocaleRule implements WeightedStepWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedStepWindow): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedStepWindowNotesLengthRule implements WeightedStepWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedStepWindow): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a weighted step window. */
export class WeightedStepWindowValidator {
  rules: WeightedStepWindowRule[];

  constructor(rules: WeightedStepWindowRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedStepWindow): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedStepWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedStepWindow[]): Map<string, string[]> {
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

export function defaultWeightedStepWindowValidator(): WeightedStepWindowValidator {
  return new WeightedStepWindowValidator(
    [
      new WeightedStepWindowCodePrefixRule("Q"),
      new WeightedStepWindowRequiredLocaleRule("weighted step window needs a value"),
      new WeightedStepWindowNotesLengthRule(255),
    ],
  );
}
