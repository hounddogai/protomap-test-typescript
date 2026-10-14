import { PostException } from "./post-exception.js";

/** A rule a post exception must pass. Check returns its problems, or none. */
export interface PostExceptionRule {
  check(item: PostException): string[];
}

export class PostExceptionCodeLengthRule implements PostExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PostException): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PostExceptionRequiredExternalRefRule implements PostExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PostException): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class PostExceptionRateRangeRule implements PostExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PostException): string[] {
    const value = item.rate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PostExceptionLabelLengthRule implements PostExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PostException): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a post exception. */
export class PostExceptionValidator {
  rules: PostExceptionRule[];

  constructor(rules: PostExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: PostException): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PostException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PostException[]): Map<string, string[]> {
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

export function defaultPostExceptionValidator(): PostExceptionValidator {
  return new PostExceptionValidator(
    [
      new PostExceptionCodeLengthRule(16),
      new PostExceptionRequiredExternalRefRule("post exception needs this field"),
      new PostExceptionRateRangeRule(7.3, 1133.6),
      new PostExceptionLabelLengthRule(16),
    ],
  );
}
