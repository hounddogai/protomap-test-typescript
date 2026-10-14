import { QueueReview } from "./queue-review.js";

/** A rule a queue review must pass. Check returns its problems, or none. */
export interface QueueReviewRule {
  check(item: QueueReview): string[];
}

export class QueueReviewAmountRangeRule implements QueueReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: QueueReview): string[] {
    const value = item.amount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`amount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`amount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class QueueReviewRetriesRangeRule implements QueueReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: QueueReview): string[] {
    const value = item.retries;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`retries ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`retries ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class QueueReviewQuantityRangeRule implements QueueReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: QueueReview): string[] {
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

export class QueueReviewRequiredTitleRule implements QueueReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: QueueReview): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a queue review. */
export class QueueReviewValidator {
  rules: QueueReviewRule[];

  constructor(rules: QueueReviewRule[]) {
    this.rules = rules;
  }

  validate(item: QueueReview): string[] {
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

  requireValid(item: QueueReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: QueueReview[]): Map<string, string[]> {
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

export function defaultQueueReviewValidator(): QueueReviewValidator {
  return new QueueReviewValidator(
    [
      new QueueReviewAmountRangeRule(10, 4871.6),
      new QueueReviewRetriesRangeRule(64, 86400),
      new QueueReviewQuantityRangeRule(32, 1000),
      new QueueReviewRequiredTitleRule("queue review needs a value"),
    ],
  );
}
