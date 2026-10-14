import { CappedFrequencyReview } from "./capped-frequency-review.js";

/** A rule a capped frequency review must pass. Check returns its problems, or none. */
export interface CappedFrequencyReviewRule {
  check(item: CappedFrequencyReview): string[];
}

export class CappedFrequencyReviewRequiredCampaignRefRule implements CappedFrequencyReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedFrequencyReview): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class CappedFrequencyReviewLabelLengthRule implements CappedFrequencyReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedFrequencyReview): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedFrequencyReviewRequiredLabelRule implements CappedFrequencyReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedFrequencyReview): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class CappedFrequencyReviewCampaignRefLengthRule implements CappedFrequencyReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedFrequencyReview): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedFrequencyReviewRatioRangeRule implements CappedFrequencyReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedFrequencyReview): string[] {
    const value = item.ratio;
    if (value < this.min || value > this.max) return [`ratio ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a capped frequency review. */
export class CappedFrequencyReviewValidator {
  rules: CappedFrequencyReviewRule[];

  constructor(rules: CappedFrequencyReviewRule[]) {
    this.rules = rules;
  }

  validate(item: CappedFrequencyReview): string[] {
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

  requireValid(item: CappedFrequencyReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedFrequencyReview[]): Map<string, string[]> {
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

export function defaultCappedFrequencyReviewValidator(): CappedFrequencyReviewValidator {
  return new CappedFrequencyReviewValidator(
    [
      new CappedFrequencyReviewRequiredCampaignRefRule("capped frequency review needs a value"),
      new CappedFrequencyReviewLabelLengthRule(86400),
      new CappedFrequencyReviewRequiredLabelRule("capped frequency review needs an entry"),
      new CappedFrequencyReviewCampaignRefLengthRule(3600),
      new CappedFrequencyReviewRatioRangeRule(3.2, 4324.2),
    ],
  );
}
