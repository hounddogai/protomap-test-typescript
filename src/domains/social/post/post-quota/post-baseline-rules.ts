import * as text from "../../../../kit/text.js";
import { PostBaseline } from "./post-baseline.js";

/** A rule a post baseline must pass. Check returns its problems, or none. */
export interface PostBaselineRule {
  check(item: PostBaseline): string[];
}

export class PostBaselineDescriptionLengthRule implements PostBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PostBaseline): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PostBaselineLocaleLengthRule implements PostBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PostBaseline): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PostBaselineEndsAtRangeRule implements PostBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PostBaseline): string[] {
    const value = item.endsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ends at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ends at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PostBaselineAllowedDescriptionRule implements PostBaselineRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PostBaseline): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.description))) return [`description ${item.description} is not allowed`];
    return [];
  }
}

export class PostBaselineRequiredTitleRule implements PostBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PostBaseline): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a post baseline. */
export class PostBaselineValidator {
  rules: PostBaselineRule[];

  constructor(rules: PostBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: PostBaseline): string[] {
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

  requireValid(item: PostBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PostBaseline[]): Map<string, string[]> {
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

export function defaultPostBaselineValidator(): PostBaselineValidator {
  return new PostBaselineValidator(
    [
      new PostBaselineDescriptionLengthRule(80),
      new PostBaselineLocaleLengthRule(255),
      new PostBaselineEndsAtRangeRule(1000, 3600),
      new PostBaselineAllowedDescriptionRule(["tiered", "pending", "fallback"]),
      new PostBaselineRequiredTitleRule("post baseline needs a value"),
    ],
  );
}
