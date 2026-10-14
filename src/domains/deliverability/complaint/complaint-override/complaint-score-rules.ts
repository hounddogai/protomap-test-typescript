import { ComplaintScore } from "./complaint-score.js";

/** A rule a complaint score must pass. Check returns its problems, or none. */
export interface ComplaintScoreRule {
  check(item: ComplaintScore): string[];
}

export class ComplaintScoreCategoryLengthRule implements ComplaintScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ComplaintScore): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ComplaintScoreRequiredLocaleRule implements ComplaintScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ComplaintScore): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class ComplaintScoreCreatedAtRangeRule implements ComplaintScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ComplaintScore): string[] {
    const value = item.createdAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`created at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`created at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ComplaintScoreCodeLengthRule implements ComplaintScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ComplaintScore): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a complaint score. */
export class ComplaintScoreValidator {
  rules: ComplaintScoreRule[];

  constructor(rules: ComplaintScoreRule[]) {
    this.rules = rules;
  }

  validate(item: ComplaintScore): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ComplaintScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ComplaintScore[]): Map<string, string[]> {
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

export function defaultComplaintScoreValidator(): ComplaintScoreValidator {
  return new ComplaintScoreValidator(
    [
      new ComplaintScoreCategoryLengthRule(80),
      new ComplaintScoreRequiredLocaleRule("complaint score needs an entry"),
      new ComplaintScoreCreatedAtRangeRule(86400, 86400),
      new ComplaintScoreCodeLengthRule(64),
    ],
  );
}
