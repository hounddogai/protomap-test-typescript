import { ManualPathReview } from "./manual-path-review.js";

/** A rule a manual path review must pass. Check returns its problems, or none. */
export interface ManualPathReviewRule {
  check(item: ManualPathReview): string[];
}

export class ManualPathReviewCodeLengthRule implements ManualPathReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualPathReview): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualPathReviewCostRangeRule implements ManualPathReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualPathReview): string[] {
    const value = item.cost;
    if (value < this.min || value > this.max) return [`cost ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ManualPathReviewRequiredCodeRule implements ManualPathReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualPathReview): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ManualPathReviewRequiredTitleRule implements ManualPathReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualPathReview): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class ManualPathReviewClicksRangeRule implements ManualPathReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualPathReview): string[] {
    const value = item.clicks;
    if (value < this.min || value > this.max) return [`clicks ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ManualPathReviewChecksumLengthRule implements ManualPathReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualPathReview): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a manual path review. */
export class ManualPathReviewValidator {
  rules: ManualPathReviewRule[];

  constructor(rules: ManualPathReviewRule[]) {
    this.rules = rules;
  }

  validate(item: ManualPathReview): string[] {
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

  requireValid(item: ManualPathReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualPathReview[]): Map<string, string[]> {
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

export function defaultManualPathReviewValidator(): ManualPathReviewValidator {
  return new ManualPathReviewValidator(
    [
      new ManualPathReviewCodeLengthRule(80),
      new ManualPathReviewCostRangeRule(2.3, 927.8),
      new ManualPathReviewRequiredCodeRule("manual path review needs this field"),
      new ManualPathReviewRequiredTitleRule("manual path review needs this field"),
      new ManualPathReviewClicksRangeRule(64, 86400),
      new ManualPathReviewChecksumLengthRule(3600),
    ],
  );
}
