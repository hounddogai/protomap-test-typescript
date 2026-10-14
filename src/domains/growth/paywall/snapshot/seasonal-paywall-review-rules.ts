import { SeasonalPaywallReview } from "./seasonal-paywall-review.js";

/** A rule a seasonal paywall review must pass. Check returns its problems, or none. */
export interface SeasonalPaywallReviewRule {
  check(item: SeasonalPaywallReview): string[];
}

export class SeasonalPaywallReviewLimitRangeRule implements SeasonalPaywallReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalPaywallReview): string[] {
    const value = item.limit;
    if (value < this.min || value > this.max) return [`limit ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SeasonalPaywallReviewSourceLengthRule implements SeasonalPaywallReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalPaywallReview): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalPaywallReviewNotesLengthRule implements SeasonalPaywallReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalPaywallReview): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalPaywallReviewRequiredNotesRule implements SeasonalPaywallReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalPaywallReview): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalPaywallReviewNameLengthRule implements SeasonalPaywallReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalPaywallReview): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a seasonal paywall review. */
export class SeasonalPaywallReviewValidator {
  rules: SeasonalPaywallReviewRule[];

  constructor(rules: SeasonalPaywallReviewRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalPaywallReview): string[] {
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

  requireValid(item: SeasonalPaywallReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalPaywallReview[]): Map<string, string[]> {
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

export function defaultSeasonalPaywallReviewValidator(): SeasonalPaywallReviewValidator {
  return new SeasonalPaywallReviewValidator(
    [
      new SeasonalPaywallReviewLimitRangeRule(32, 86400),
      new SeasonalPaywallReviewSourceLengthRule(86400),
      new SeasonalPaywallReviewNotesLengthRule(120),
      new SeasonalPaywallReviewRequiredNotesRule("seasonal paywall review needs a value"),
      new SeasonalPaywallReviewNameLengthRule(86400),
    ],
  );
}
