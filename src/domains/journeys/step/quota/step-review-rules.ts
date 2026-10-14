import * as text from "../../../../kit/text.js";
import { StepReview } from "./step-review.js";

/** A rule a step review must pass. Check returns its problems, or none. */
export interface StepReviewRule {
  check(item: StepReview): string[];
}

export class StepReviewUpdatedAtRangeRule implements StepReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StepReview): string[] {
    const value = item.updatedAt;
    if (value < this.min || value > this.max) return [`updated at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StepReviewDescriptionLengthRule implements StepReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StepReview): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StepReviewRequiredDescriptionRule implements StepReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StepReview): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

export class StepReviewAllowedLabelRule implements StepReviewRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StepReview): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is out of range`];
    return [];
  }
}

/** Runs every rule of a step review. */
export class StepReviewValidator {
  rules: StepReviewRule[];

  constructor(rules: StepReviewRule[]) {
    this.rules = rules;
  }

  validate(item: StepReview): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StepReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StepReview[]): Map<string, string[]> {
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

export function defaultStepReviewValidator(): StepReviewValidator {
  return new StepReviewValidator(
    [
      new StepReviewUpdatedAtRangeRule(32, 64),
      new StepReviewDescriptionLengthRule(3600),
      new StepReviewRequiredDescriptionRule("step review needs a value"),
      new StepReviewAllowedLabelRule(["seasonal", "rolling"]),
    ],
  );
}
