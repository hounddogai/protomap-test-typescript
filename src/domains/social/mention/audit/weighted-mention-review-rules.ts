import { WeightedMentionReview } from "./weighted-mention-review.js";

/** A rule a weighted mention review must pass. Check returns its problems, or none. */
export interface WeightedMentionReviewRule {
  check(item: WeightedMentionReview): string[];
}

export class WeightedMentionReviewRequiredCodeRule implements WeightedMentionReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedMentionReview): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedMentionReviewCodePrefixRule implements WeightedMentionReviewRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WeightedMentionReview): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WeightedMentionReviewRequiredNameRule implements WeightedMentionReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedMentionReview): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a weighted mention review. */
export class WeightedMentionReviewValidator {
  rules: WeightedMentionReviewRule[];

  constructor(rules: WeightedMentionReviewRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedMentionReview): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedMentionReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedMentionReview[]): Map<string, string[]> {
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

export function defaultWeightedMentionReviewValidator(): WeightedMentionReviewValidator {
  return new WeightedMentionReviewValidator(
    [
      new WeightedMentionReviewRequiredCodeRule("weighted mention review needs a value"),
      new WeightedMentionReviewCodePrefixRule("OPS"),
      new WeightedMentionReviewRequiredNameRule("weighted mention review needs an entry"),
    ],
  );
}
