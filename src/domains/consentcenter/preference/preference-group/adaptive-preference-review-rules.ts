import { AdaptivePreferenceReview } from "./adaptive-preference-review.js";

/** A rule a adaptive preference review must pass. Check returns its problems, or none. */
export interface AdaptivePreferenceReviewRule {
  check(item: AdaptivePreferenceReview): string[];
}

export class AdaptivePreferenceReviewRequiredLocaleRule implements AdaptivePreferenceReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptivePreferenceReview): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptivePreferenceReviewCodeLengthRule implements AdaptivePreferenceReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptivePreferenceReview): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptivePreferenceReviewMaximumRangeRule implements AdaptivePreferenceReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptivePreferenceReview): string[] {
    const value = item.maximum;
    if (value < this.min || value > this.max) return [`maximum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class AdaptivePreferenceReviewRequiredCodeRule implements AdaptivePreferenceReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptivePreferenceReview): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a adaptive preference review. */
export class AdaptivePreferenceReviewValidator {
  rules: AdaptivePreferenceReviewRule[];

  constructor(rules: AdaptivePreferenceReviewRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptivePreferenceReview): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptivePreferenceReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptivePreferenceReview[]): Map<string, string[]> {
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

export function defaultAdaptivePreferenceReviewValidator(): AdaptivePreferenceReviewValidator {
  return new AdaptivePreferenceReviewValidator(
    [
      new AdaptivePreferenceReviewRequiredLocaleRule("adaptive preference review needs a value"),
      new AdaptivePreferenceReviewCodeLengthRule(86400),
      new AdaptivePreferenceReviewMaximumRangeRule(8.8, 4237.8),
      new AdaptivePreferenceReviewRequiredCodeRule("adaptive preference review needs a value"),
    ],
  );
}
