import { BatchedBouncePreference } from "./batched-bounce-preference.js";

/** A rule a batched bounce preference must pass. Check returns its problems, or none. */
export interface BatchedBouncePreferenceRule {
  check(item: BatchedBouncePreference): string[];
}

export class BatchedBouncePreferenceRequiredCodeRule implements BatchedBouncePreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedBouncePreference): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedBouncePreferenceRevisionRangeRule implements BatchedBouncePreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedBouncePreference): string[] {
    const value = item.revision;
    if (value < this.min || value > this.max) return [`revision ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BatchedBouncePreferenceLabelLengthRule implements BatchedBouncePreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedBouncePreference): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a batched bounce preference. */
export class BatchedBouncePreferenceValidator {
  rules: BatchedBouncePreferenceRule[];

  constructor(rules: BatchedBouncePreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedBouncePreference): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedBouncePreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedBouncePreference[]): Map<string, string[]> {
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

export function defaultBatchedBouncePreferenceValidator(): BatchedBouncePreferenceValidator {
  return new BatchedBouncePreferenceValidator(
    [
      new BatchedBouncePreferenceRequiredCodeRule("batched bounce preference needs an entry"),
      new BatchedBouncePreferenceRevisionRangeRule(32, 1000),
      new BatchedBouncePreferenceLabelLengthRule(64),
    ],
  );
}
