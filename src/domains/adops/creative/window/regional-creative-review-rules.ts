import { RegionalCreativeReview } from "./regional-creative-review.js";

/** A rule a regional creative review must pass. Check returns its problems, or none. */
export interface RegionalCreativeReviewRule {
  check(item: RegionalCreativeReview): string[];
}

export class RegionalCreativeReviewRequiredPhoneRule implements RegionalCreativeReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalCreativeReview): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalCreativeReviewRetriesRangeRule implements RegionalCreativeReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalCreativeReview): string[] {
    const value = item.retries;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`retries ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`retries ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RegionalCreativeReviewRequiredCodeRule implements RegionalCreativeReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalCreativeReview): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a regional creative review. */
export class RegionalCreativeReviewValidator {
  rules: RegionalCreativeReviewRule[];

  constructor(rules: RegionalCreativeReviewRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalCreativeReview): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RegionalCreativeReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalCreativeReview[]): Map<string, string[]> {
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

export function defaultRegionalCreativeReviewValidator(): RegionalCreativeReviewValidator {
  return new RegionalCreativeReviewValidator(
    [
      new RegionalCreativeReviewRequiredPhoneRule("regional creative review needs a value"),
      new RegionalCreativeReviewRetriesRangeRule(16, 255),
      new RegionalCreativeReviewRequiredCodeRule("regional creative review needs a value"),
    ],
  );
}
