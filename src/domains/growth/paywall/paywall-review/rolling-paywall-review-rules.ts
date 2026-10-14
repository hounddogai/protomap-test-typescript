import { RollingPaywallReview } from "./rolling-paywall-review.js";

/** A rule a rolling paywall review must pass. Check returns its problems, or none. */
export interface RollingPaywallReviewRule {
  check(item: RollingPaywallReview): string[];
}

export class RollingPaywallReviewRequiredTitleRule implements RollingPaywallReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingPaywallReview): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class RollingPaywallReviewJourneyIdLengthRule implements RollingPaywallReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingPaywallReview): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingPaywallReviewRequiredJourneyIdRule implements RollingPaywallReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingPaywallReview): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a rolling paywall review. */
export class RollingPaywallReviewValidator {
  rules: RollingPaywallReviewRule[];

  constructor(rules: RollingPaywallReviewRule[]) {
    this.rules = rules;
  }

  validate(item: RollingPaywallReview): string[] {
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

  requireValid(item: RollingPaywallReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingPaywallReview[]): Map<string, string[]> {
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

export function defaultRollingPaywallReviewValidator(): RollingPaywallReviewValidator {
  return new RollingPaywallReviewValidator(
    [
      new RollingPaywallReviewRequiredTitleRule("rolling paywall review needs an entry"),
      new RollingPaywallReviewJourneyIdLengthRule(86400),
      new RollingPaywallReviewRequiredJourneyIdRule("rolling paywall review needs an entry"),
    ],
  );
}
