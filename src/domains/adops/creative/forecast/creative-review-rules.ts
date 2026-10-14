import { CreativeReview } from "./creative-review.js";

/** A rule a creative review must pass. Check returns its problems, or none. */
export interface CreativeReviewRule {
  check(item: CreativeReview): string[];
}

export class CreativeReviewCodePrefixRule implements CreativeReviewRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CreativeReview): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CreativeReviewQuantityRangeRule implements CreativeReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreativeReview): string[] {
    const value = item.quantity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`quantity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`quantity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CreativeReviewRequiredNotesRule implements CreativeReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreativeReview): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

export class CreativeReviewRequiredLabelRule implements CreativeReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreativeReview): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a creative review. */
export class CreativeReviewValidator {
  rules: CreativeReviewRule[];

  constructor(rules: CreativeReviewRule[]) {
    this.rules = rules;
  }

  validate(item: CreativeReview): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CreativeReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CreativeReview[]): Map<string, string[]> {
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

export function defaultCreativeReviewValidator(): CreativeReviewValidator {
  return new CreativeReviewValidator(
    [
      new CreativeReviewCodePrefixRule("REF"),
      new CreativeReviewQuantityRangeRule(1000, 1000),
      new CreativeReviewRequiredNotesRule("creative review needs this field"),
      new CreativeReviewRequiredLabelRule("creative review needs this field"),
    ],
  );
}
