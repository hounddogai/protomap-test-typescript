import { ManualPacingReview } from "./manual-pacing-review.js";

/** A rule a manual pacing review must pass. Check returns its problems, or none. */
export interface ManualPacingReviewRule {
  check(item: ManualPacingReview): string[];
}

export class ManualPacingReviewLocaleLengthRule implements ManualPacingReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualPacingReview): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualPacingReviewCodeLengthRule implements ManualPacingReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualPacingReview): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualPacingReviewLabelLengthRule implements ManualPacingReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualPacingReview): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualPacingReviewRatioRangeRule implements ManualPacingReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualPacingReview): string[] {
    const value = item.ratio;
    if (value < this.min || value > this.max) return [`ratio ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ManualPacingReviewRequiredDescriptionRule implements ManualPacingReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualPacingReview): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

export class ManualPacingReviewCodePrefixRule implements ManualPacingReviewRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ManualPacingReview): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a manual pacing review. */
export class ManualPacingReviewValidator {
  rules: ManualPacingReviewRule[];

  constructor(rules: ManualPacingReviewRule[]) {
    this.rules = rules;
  }

  validate(item: ManualPacingReview): string[] {
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

  requireValid(item: ManualPacingReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualPacingReview[]): Map<string, string[]> {
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

export function defaultManualPacingReviewValidator(): ManualPacingReviewValidator {
  return new ManualPacingReviewValidator(
    [
      new ManualPacingReviewLocaleLengthRule(1000),
      new ManualPacingReviewCodeLengthRule(120),
      new ManualPacingReviewLabelLengthRule(80),
      new ManualPacingReviewRatioRangeRule(5.3, 4901.1),
      new ManualPacingReviewRequiredDescriptionRule("manual pacing review needs this field"),
      new ManualPacingReviewCodePrefixRule("Q"),
    ],
  );
}
