import { SeasonalInsightReview } from "./seasonal-insight-review.js";

/** A rule a seasonal insight review must pass. Check returns its problems, or none. */
export interface SeasonalInsightReviewRule {
  check(item: SeasonalInsightReview): string[];
}

export class SeasonalInsightReviewLabelLengthRule implements SeasonalInsightReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalInsightReview): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalInsightReviewCodeLengthRule implements SeasonalInsightReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalInsightReview): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalInsightReviewNameLengthRule implements SeasonalInsightReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalInsightReview): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalInsightReviewOpenRateRangeRule implements SeasonalInsightReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalInsightReview): string[] {
    const value = item.openRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`open rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`open rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SeasonalInsightReviewCodePrefixRule implements SeasonalInsightReviewRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SeasonalInsightReview): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a seasonal insight review. */
export class SeasonalInsightReviewValidator {
  rules: SeasonalInsightReviewRule[];

  constructor(rules: SeasonalInsightReviewRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalInsightReview): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SeasonalInsightReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalInsightReview[]): Map<string, string[]> {
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

export function defaultSeasonalInsightReviewValidator(): SeasonalInsightReviewValidator {
  return new SeasonalInsightReviewValidator(
    [
      new SeasonalInsightReviewLabelLengthRule(64),
      new SeasonalInsightReviewCodeLengthRule(86400),
      new SeasonalInsightReviewNameLengthRule(32),
      new SeasonalInsightReviewOpenRateRangeRule(0.5, 4853.6),
      new SeasonalInsightReviewCodePrefixRule("REF"),
    ],
  );
}
