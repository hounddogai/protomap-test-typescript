import { ManualPreferenceReview } from "./manual-preference-review.js";

/** A rule a manual preference review must pass. Check returns its problems, or none. */
export interface ManualPreferenceReviewRule {
  check(item: ManualPreferenceReview): string[];
}

export class ManualPreferenceReviewRequiredNameRule implements ManualPreferenceReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualPreferenceReview): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class ManualPreferenceReviewMaximumRangeRule implements ManualPreferenceReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualPreferenceReview): string[] {
    const value = item.maximum;
    if (value < this.min || value > this.max) return [`maximum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ManualPreferenceReviewRequiredCodeRule implements ManualPreferenceReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualPreferenceReview): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ManualPreferenceReviewFrequencyCapRangeRule implements ManualPreferenceReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualPreferenceReview): string[] {
    const value = item.frequencyCap;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`frequency cap ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`frequency cap ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a manual preference review. */
export class ManualPreferenceReviewValidator {
  rules: ManualPreferenceReviewRule[];

  constructor(rules: ManualPreferenceReviewRule[]) {
    this.rules = rules;
  }

  validate(item: ManualPreferenceReview): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualPreferenceReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualPreferenceReview[]): Map<string, string[]> {
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

export function defaultManualPreferenceReviewValidator(): ManualPreferenceReviewValidator {
  return new ManualPreferenceReviewValidator(
    [
      new ManualPreferenceReviewRequiredNameRule("manual preference review needs an entry"),
      new ManualPreferenceReviewMaximumRangeRule(2.7, 4026.8),
      new ManualPreferenceReviewRequiredCodeRule("manual preference review needs an entry"),
      new ManualPreferenceReviewFrequencyCapRangeRule(32, 255),
    ],
  );
}
