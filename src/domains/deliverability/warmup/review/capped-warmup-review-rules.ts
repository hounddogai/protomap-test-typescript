import { CappedWarmupReview } from "./capped-warmup-review.js";

/** A rule a capped warmup review must pass. Check returns its problems, or none. */
export interface CappedWarmupReviewRule {
  check(item: CappedWarmupReview): string[];
}

export class CappedWarmupReviewCodeLengthRule implements CappedWarmupReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedWarmupReview): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedWarmupReviewCodePrefixRule implements CappedWarmupReviewRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CappedWarmupReview): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CappedWarmupReviewWeightRangeRule implements CappedWarmupReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedWarmupReview): string[] {
    const value = item.weight;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`weight ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`weight ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CappedWarmupReviewRequiredNotesRule implements CappedWarmupReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedWarmupReview): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a capped warmup review. */
export class CappedWarmupReviewValidator {
  rules: CappedWarmupReviewRule[];

  constructor(rules: CappedWarmupReviewRule[]) {
    this.rules = rules;
  }

  validate(item: CappedWarmupReview): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CappedWarmupReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedWarmupReview[]): Map<string, string[]> {
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

export function defaultCappedWarmupReviewValidator(): CappedWarmupReviewValidator {
  return new CappedWarmupReviewValidator(
    [
      new CappedWarmupReviewCodeLengthRule(64),
      new CappedWarmupReviewCodePrefixRule("X"),
      new CappedWarmupReviewWeightRangeRule(3.3, 2571.1),
      new CappedWarmupReviewRequiredNotesRule("capped warmup review needs a value"),
    ],
  );
}
