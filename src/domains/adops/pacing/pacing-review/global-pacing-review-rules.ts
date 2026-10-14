import { GlobalPacingReview } from "./global-pacing-review.js";

/** A rule a global pacing review must pass. Check returns its problems, or none. */
export interface GlobalPacingReviewRule {
  check(item: GlobalPacingReview): string[];
}

export class GlobalPacingReviewCodeLengthRule implements GlobalPacingReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalPacingReview): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalPacingReviewCodePrefixRule implements GlobalPacingReviewRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: GlobalPacingReview): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class GlobalPacingReviewUpdatedAtRangeRule implements GlobalPacingReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalPacingReview): string[] {
    const value = item.updatedAt;
    if (value < this.min || value > this.max) return [`updated at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class GlobalPacingReviewRequiredTitleRule implements GlobalPacingReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalPacingReview): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalPacingReviewExternalRefLengthRule implements GlobalPacingReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalPacingReview): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalPacingReviewRatioRangeRule implements GlobalPacingReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalPacingReview): string[] {
    const value = item.ratio;
    if (value < this.min || value > this.max) return [`ratio ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a global pacing review. */
export class GlobalPacingReviewValidator {
  rules: GlobalPacingReviewRule[];

  constructor(rules: GlobalPacingReviewRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalPacingReview): string[] {
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

  requireValid(item: GlobalPacingReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalPacingReview[]): Map<string, string[]> {
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

export function defaultGlobalPacingReviewValidator(): GlobalPacingReviewValidator {
  return new GlobalPacingReviewValidator(
    [
      new GlobalPacingReviewCodeLengthRule(255),
      new GlobalPacingReviewCodePrefixRule("REF"),
      new GlobalPacingReviewUpdatedAtRangeRule(120, 1000),
      new GlobalPacingReviewRequiredTitleRule("global pacing review needs this field"),
      new GlobalPacingReviewExternalRefLengthRule(80),
      new GlobalPacingReviewRatioRangeRule(0.4, 4301.3),
    ],
  );
}
