import { CappedBidRuleReview } from "./capped-bid-rule-review.js";

/** A rule a capped bid rule review must pass. Check returns its problems, or none. */
export interface CappedBidRuleReviewRule {
  check(item: CappedBidRuleReview): string[];
}

export class CappedBidRuleReviewRequiredVariantRule implements CappedBidRuleReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedBidRuleReview): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

export class CappedBidRuleReviewRequiredTitleRule implements CappedBidRuleReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedBidRuleReview): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class CappedBidRuleReviewBatchSizeRangeRule implements CappedBidRuleReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedBidRuleReview): string[] {
    const value = item.batchSize;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`batch size ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`batch size ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CappedBidRuleReviewRequiredNotesRule implements CappedBidRuleReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedBidRuleReview): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

export class CappedBidRuleReviewMaximumRangeRule implements CappedBidRuleReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedBidRuleReview): string[] {
    const value = item.maximum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`maximum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`maximum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a capped bid rule review. */
export class CappedBidRuleReviewValidator {
  rules: CappedBidRuleReviewRule[];

  constructor(rules: CappedBidRuleReviewRule[]) {
    this.rules = rules;
  }

  validate(item: CappedBidRuleReview): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CappedBidRuleReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedBidRuleReview[]): Map<string, string[]> {
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

export function defaultCappedBidRuleReviewValidator(): CappedBidRuleReviewValidator {
  return new CappedBidRuleReviewValidator(
    [
      new CappedBidRuleReviewRequiredVariantRule("capped bid rule review needs this field"),
      new CappedBidRuleReviewRequiredTitleRule("capped bid rule review needs a value"),
      new CappedBidRuleReviewBatchSizeRangeRule(80, 86400),
      new CappedBidRuleReviewRequiredNotesRule("capped bid rule review needs an entry"),
      new CappedBidRuleReviewMaximumRangeRule(5, 638.4),
    ],
  );
}
