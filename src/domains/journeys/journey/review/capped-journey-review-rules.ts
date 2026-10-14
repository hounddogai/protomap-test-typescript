import { CappedJourneyReview } from "./capped-journey-review.js";

/** A rule a capped journey review must pass. Check returns its problems, or none. */
export interface CappedJourneyReviewRule {
  check(item: CappedJourneyReview): string[];
}

export class CappedJourneyReviewCodePrefixRule implements CappedJourneyReviewRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CappedJourneyReview): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CappedJourneyReviewCodeLengthRule implements CappedJourneyReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedJourneyReview): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedJourneyReviewRequiredTitleRule implements CappedJourneyReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedJourneyReview): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class CappedJourneyReviewUnitLengthRule implements CappedJourneyReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedJourneyReview): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedJourneyReviewRequiredUnitRule implements CappedJourneyReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedJourneyReview): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

export class CappedJourneyReviewTitleLengthRule implements CappedJourneyReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedJourneyReview): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a capped journey review. */
export class CappedJourneyReviewValidator {
  rules: CappedJourneyReviewRule[];

  constructor(rules: CappedJourneyReviewRule[]) {
    this.rules = rules;
  }

  validate(item: CappedJourneyReview): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CappedJourneyReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedJourneyReview[]): Map<string, string[]> {
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

export function defaultCappedJourneyReviewValidator(): CappedJourneyReviewValidator {
  return new CappedJourneyReviewValidator(
    [
      new CappedJourneyReviewCodePrefixRule("OPS"),
      new CappedJourneyReviewCodeLengthRule(86400),
      new CappedJourneyReviewRequiredTitleRule("capped journey review needs this field"),
      new CappedJourneyReviewUnitLengthRule(255),
      new CappedJourneyReviewRequiredUnitRule("capped journey review needs a value"),
      new CappedJourneyReviewTitleLengthRule(255),
    ],
  );
}
