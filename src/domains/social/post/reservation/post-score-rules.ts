import { PostScore } from "./post-score.js";

/** A rule a post score must pass. Check returns its problems, or none. */
export interface PostScoreRule {
  check(item: PostScore): string[];
}

export class PostScoreDiscountRangeRule implements PostScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PostScore): string[] {
    const value = item.discount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`discount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`discount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PostScoreCodeLengthRule implements PostScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PostScore): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PostScoreTitleLengthRule implements PostScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PostScore): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a post score. */
export class PostScoreValidator {
  rules: PostScoreRule[];

  constructor(rules: PostScoreRule[]) {
    this.rules = rules;
  }

  validate(item: PostScore): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PostScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PostScore[]): Map<string, string[]> {
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

export function defaultPostScoreValidator(): PostScoreValidator {
  return new PostScoreValidator(
    [
      new PostScoreDiscountRangeRule(5.3, 1006.5),
      new PostScoreCodeLengthRule(64),
      new PostScoreTitleLengthRule(32),
    ],
  );
}
