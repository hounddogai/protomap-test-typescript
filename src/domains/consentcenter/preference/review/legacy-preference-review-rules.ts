import { LegacyPreferenceReview } from "./legacy-preference-review.js";

/** A rule a legacy preference review must pass. Check returns its problems, or none. */
export interface LegacyPreferenceReviewRule {
  check(item: LegacyPreferenceReview): string[];
}

export class LegacyPreferenceReviewFloorValueRangeRule implements LegacyPreferenceReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyPreferenceReview): string[] {
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

export class LegacyPreferenceReviewNameLengthRule implements LegacyPreferenceReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyPreferenceReview): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyPreferenceReviewRequiredTimezoneRule implements LegacyPreferenceReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyPreferenceReview): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyPreferenceReviewCeilingRangeRule implements LegacyPreferenceReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyPreferenceReview): string[] {
    const value = item.ceiling;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ceiling ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ceiling ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LegacyPreferenceReviewRequiredNameRule implements LegacyPreferenceReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyPreferenceReview): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a legacy preference review. */
export class LegacyPreferenceReviewValidator {
  rules: LegacyPreferenceReviewRule[];

  constructor(rules: LegacyPreferenceReviewRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyPreferenceReview): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacyPreferenceReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyPreferenceReview[]): Map<string, string[]> {
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

export function defaultLegacyPreferenceReviewValidator(): LegacyPreferenceReviewValidator {
  return new LegacyPreferenceReviewValidator(
    [
      new LegacyPreferenceReviewFloorValueRangeRule(5.3, 802.9),
      new LegacyPreferenceReviewNameLengthRule(3600),
      new LegacyPreferenceReviewRequiredTimezoneRule("legacy preference review needs an entry"),
      new LegacyPreferenceReviewCeilingRangeRule(6, 4750.6),
      new LegacyPreferenceReviewRequiredNameRule("legacy preference review needs an entry"),
    ],
  );
}
