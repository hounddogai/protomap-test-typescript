import * as text from "../../../../kit/text.js";
import { PostOverride } from "./post-override.js";

/** A rule a post override must pass. Check returns its problems, or none. */
export interface PostOverrideRule {
  check(item: PostOverride): string[];
}

export class PostOverrideCreatedAtRangeRule implements PostOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PostOverride): string[] {
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

export class PostOverrideAllowedCodeRule implements PostOverrideRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PostOverride): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is blocked`];
    return [];
  }
}

export class PostOverrideRequiredTitleRule implements PostOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PostOverride): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class PostOverrideCodePrefixRule implements PostOverrideRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PostOverride): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PostOverrideRatioRangeRule implements PostOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PostOverride): string[] {
    const value = item.ratio;
    if (value < this.min || value > this.max) return [`ratio ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PostOverrideRequiredCodeRule implements PostOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PostOverride): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a post override. */
export class PostOverrideValidator {
  rules: PostOverrideRule[];

  constructor(rules: PostOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: PostOverride): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PostOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PostOverride[]): Map<string, string[]> {
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

export function defaultPostOverrideValidator(): PostOverrideValidator {
  return new PostOverrideValidator(
    [
      new PostOverrideCreatedAtRangeRule(16, 1000),
      new PostOverrideAllowedCodeRule(["manual", "scheduled", "tiered"]),
      new PostOverrideRequiredTitleRule("post override needs this field"),
      new PostOverrideCodePrefixRule("OPS"),
      new PostOverrideRatioRangeRule(8.7, 3891.5),
      new PostOverrideRequiredCodeRule("post override needs this field"),
    ],
  );
}
