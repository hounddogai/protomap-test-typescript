import { GlobalEnrollmentReview } from "./global-enrollment-review.js";

/** A rule a global enrollment review must pass. Check returns its problems, or none. */
export interface GlobalEnrollmentReviewRule {
  check(item: GlobalEnrollmentReview): string[];
}

export class GlobalEnrollmentReviewCostRangeRule implements GlobalEnrollmentReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalEnrollmentReview): string[] {
    const value = item.cost;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`cost ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`cost ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class GlobalEnrollmentReviewRequiredChannelRule implements GlobalEnrollmentReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalEnrollmentReview): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalEnrollmentReviewCodePrefixRule implements GlobalEnrollmentReviewRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: GlobalEnrollmentReview): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a global enrollment review. */
export class GlobalEnrollmentReviewValidator {
  rules: GlobalEnrollmentReviewRule[];

  constructor(rules: GlobalEnrollmentReviewRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalEnrollmentReview): string[] {
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

  requireValid(item: GlobalEnrollmentReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalEnrollmentReview[]): Map<string, string[]> {
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

export function defaultGlobalEnrollmentReviewValidator(): GlobalEnrollmentReviewValidator {
  return new GlobalEnrollmentReviewValidator(
    [
      new GlobalEnrollmentReviewCostRangeRule(3.7, 1959.2),
      new GlobalEnrollmentReviewRequiredChannelRule("global enrollment review needs a value"),
      new GlobalEnrollmentReviewCodePrefixRule("ACM"),
    ],
  );
}
