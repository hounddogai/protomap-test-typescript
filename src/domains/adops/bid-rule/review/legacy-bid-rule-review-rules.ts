import { LegacyBidRuleReview } from "./legacy-bid-rule-review.js";

/** A rule a legacy bid rule review must pass. Check returns its problems, or none. */
export interface LegacyBidRuleReviewRule {
  check(item: LegacyBidRuleReview): string[];
}

export class LegacyBidRuleReviewRequiredLabelRule implements LegacyBidRuleReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyBidRuleReview): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyBidRuleReviewRequiredContactEmailRule implements LegacyBidRuleReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyBidRuleReview): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyBidRuleReviewContactEmailLengthRule implements LegacyBidRuleReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyBidRuleReview): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a legacy bid rule review. */
export class LegacyBidRuleReviewValidator {
  rules: LegacyBidRuleReviewRule[];

  constructor(rules: LegacyBidRuleReviewRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyBidRuleReview): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacyBidRuleReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyBidRuleReview[]): Map<string, string[]> {
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

export function defaultLegacyBidRuleReviewValidator(): LegacyBidRuleReviewValidator {
  return new LegacyBidRuleReviewValidator(
    [
      new LegacyBidRuleReviewRequiredLabelRule("legacy bid rule review needs this field"),
      new LegacyBidRuleReviewRequiredContactEmailRule("legacy bid rule review needs this field"),
      new LegacyBidRuleReviewContactEmailLengthRule(1000),
    ],
  );
}
