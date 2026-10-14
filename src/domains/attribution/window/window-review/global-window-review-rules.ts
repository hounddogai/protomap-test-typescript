import { GlobalWindowReview } from "./global-window-review.js";

/** A rule a global window review must pass. Check returns its problems, or none. */
export interface GlobalWindowReviewRule {
  check(item: GlobalWindowReview): string[];
}

export class GlobalWindowReviewVariantLengthRule implements GlobalWindowReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalWindowReview): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalWindowReviewThresholdRangeRule implements GlobalWindowReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalWindowReview): string[] {
    const value = item.threshold;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`threshold ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`threshold ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class GlobalWindowReviewRequiredNameRule implements GlobalWindowReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalWindowReview): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalWindowReviewApprovedGuardRule implements GlobalWindowReviewRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: GlobalWindowReview): string[] {
    if (item.approved && item.limit > this.limit) return [`limit ${item.limit} exceeds ${this.limit} while approved`];
    return [];
  }
}

/** Runs every rule of a global window review. */
export class GlobalWindowReviewValidator {
  rules: GlobalWindowReviewRule[];

  constructor(rules: GlobalWindowReviewRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalWindowReview): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalWindowReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalWindowReview[]): Map<string, string[]> {
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

export function defaultGlobalWindowReviewValidator(): GlobalWindowReviewValidator {
  return new GlobalWindowReviewValidator(
    [
      new GlobalWindowReviewVariantLengthRule(3600),
      new GlobalWindowReviewThresholdRangeRule(1.7, 1810.6),
      new GlobalWindowReviewRequiredNameRule("global window review needs a value"),
      new GlobalWindowReviewApprovedGuardRule(32),
    ],
  );
}
