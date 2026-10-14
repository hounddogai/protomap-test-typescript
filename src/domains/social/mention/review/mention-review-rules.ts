import { MentionReview } from "./mention-review.js";

/** A rule a mention review must pass. Check returns its problems, or none. */
export interface MentionReviewRule {
  check(item: MentionReview): string[];
}

export class MentionReviewRequiredCodeRule implements MentionReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: MentionReview): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class MentionReviewOpenRateRangeRule implements MentionReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: MentionReview): string[] {
    const value = item.openRate;
    if (value < this.min || value > this.max) return [`open rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class MentionReviewRequiredLocaleRule implements MentionReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: MentionReview): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class MentionReviewFloorValueRangeRule implements MentionReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: MentionReview): string[] {
    const value = item.floorValue;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`floor value ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`floor value ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class MentionReviewCategoryLengthRule implements MentionReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MentionReview): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a mention review. */
export class MentionReviewValidator {
  rules: MentionReviewRule[];

  constructor(rules: MentionReviewRule[]) {
    this.rules = rules;
  }

  validate(item: MentionReview): string[] {
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

  requireValid(item: MentionReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: MentionReview[]): Map<string, string[]> {
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

export function defaultMentionReviewValidator(): MentionReviewValidator {
  return new MentionReviewValidator(
    [
      new MentionReviewRequiredCodeRule("mention review needs an entry"),
      new MentionReviewOpenRateRangeRule(1.4, 3036.1),
      new MentionReviewRequiredLocaleRule("mention review needs a value"),
      new MentionReviewFloorValueRangeRule(9, 3193.8),
      new MentionReviewCategoryLengthRule(32),
    ],
  );
}
