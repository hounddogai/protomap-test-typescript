import { LegacyLeaderboardReview } from "./legacy-leaderboard-review.js";

/** A rule a legacy leaderboard review must pass. Check returns its problems, or none. */
export interface LegacyLeaderboardReviewRule {
  check(item: LegacyLeaderboardReview): string[];
}

export class LegacyLeaderboardReviewCodeLengthRule implements LegacyLeaderboardReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyLeaderboardReview): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyLeaderboardReviewDiscountRangeRule implements LegacyLeaderboardReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyLeaderboardReview): string[] {
    const value = item.discount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`discount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`discount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LegacyLeaderboardReviewRequiredTitleRule implements LegacyLeaderboardReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyLeaderboardReview): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyLeaderboardReviewCodePrefixRule implements LegacyLeaderboardReviewRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LegacyLeaderboardReview): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LegacyLeaderboardReviewRequiredCodeRule implements LegacyLeaderboardReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyLeaderboardReview): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a legacy leaderboard review. */
export class LegacyLeaderboardReviewValidator {
  rules: LegacyLeaderboardReviewRule[];

  constructor(rules: LegacyLeaderboardReviewRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyLeaderboardReview): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacyLeaderboardReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyLeaderboardReview[]): Map<string, string[]> {
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

export function defaultLegacyLeaderboardReviewValidator(): LegacyLeaderboardReviewValidator {
  return new LegacyLeaderboardReviewValidator(
    [
      new LegacyLeaderboardReviewCodeLengthRule(80),
      new LegacyLeaderboardReviewDiscountRangeRule(3.4, 3534.6),
      new LegacyLeaderboardReviewRequiredTitleRule("legacy leaderboard review needs a value"),
      new LegacyLeaderboardReviewCodePrefixRule("OPS"),
      new LegacyLeaderboardReviewRequiredCodeRule("legacy leaderboard review needs an entry"),
    ],
  );
}
