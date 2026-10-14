import { PostSummary } from "./post-summary.js";

/** A rule a post summary must pass. Check returns its problems, or none. */
export interface PostSummaryRule {
  check(item: PostSummary): string[];
}

export class PostSummaryUnitLengthRule implements PostSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PostSummary): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PostSummaryAmountRangeRule implements PostSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PostSummary): string[] {
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

export class PostSummaryRequiredNameRule implements PostSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PostSummary): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a post summary. */
export class PostSummaryValidator {
  rules: PostSummaryRule[];

  constructor(rules: PostSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: PostSummary): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PostSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PostSummary[]): Map<string, string[]> {
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

export function defaultPostSummaryValidator(): PostSummaryValidator {
  return new PostSummaryValidator(
    [
      new PostSummaryUnitLengthRule(64),
      new PostSummaryAmountRangeRule(7.6, 2724.6),
      new PostSummaryRequiredNameRule("post summary needs this field"),
    ],
  );
}
