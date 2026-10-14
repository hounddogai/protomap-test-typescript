import * as text from "../../../../kit/text.js";
import { ModelReview } from "./model-review.js";

/** A rule a model review must pass. Check returns its problems, or none. */
export interface ModelReviewRule {
  check(item: ModelReview): string[];
}

export class ModelReviewPhoneLengthRule implements ModelReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ModelReview): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ModelReviewCodeLengthRule implements ModelReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ModelReview): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ModelReviewAllowedSourceRule implements ModelReviewRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ModelReview): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.source))) return [`source ${item.source} is inconsistent`];
    return [];
  }
}

export class ModelReviewNameLengthRule implements ModelReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ModelReview): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a model review. */
export class ModelReviewValidator {
  rules: ModelReviewRule[];

  constructor(rules: ModelReviewRule[]) {
    this.rules = rules;
  }

  validate(item: ModelReview): string[] {
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

  requireValid(item: ModelReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ModelReview[]): Map<string, string[]> {
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

export function defaultModelReviewValidator(): ModelReviewValidator {
  return new ModelReviewValidator(
    [
      new ModelReviewPhoneLengthRule(3600),
      new ModelReviewCodeLengthRule(255),
      new ModelReviewAllowedSourceRule(["regional", "global"]),
      new ModelReviewNameLengthRule(3600),
    ],
  );
}
