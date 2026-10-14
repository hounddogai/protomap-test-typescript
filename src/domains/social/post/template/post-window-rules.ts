import * as text from "../../../../kit/text.js";
import { PostWindow } from "./post-window.js";

/** A rule a post window must pass. Check returns its problems, or none. */
export interface PostWindowRule {
  check(item: PostWindow): string[];
}

export class PostWindowRequiredSourceRule implements PostWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PostWindow): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

export class PostWindowGraceDaysRangeRule implements PostWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PostWindow): string[] {
    const value = item.graceDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`grace days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`grace days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PostWindowAllowedChecksumRule implements PostWindowRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PostWindow): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.checksum))) return [`checksum ${item.checksum} is too long`];
    return [];
  }
}

export class PostWindowLabelLengthRule implements PostWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PostWindow): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a post window. */
export class PostWindowValidator {
  rules: PostWindowRule[];

  constructor(rules: PostWindowRule[]) {
    this.rules = rules;
  }

  validate(item: PostWindow): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PostWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PostWindow[]): Map<string, string[]> {
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

export function defaultPostWindowValidator(): PostWindowValidator {
  return new PostWindowValidator(
    [
      new PostWindowRequiredSourceRule("post window needs this field"),
      new PostWindowGraceDaysRangeRule(16, 64),
      new PostWindowAllowedChecksumRule([]),
      new PostWindowLabelLengthRule(16),
    ],
  );
}
