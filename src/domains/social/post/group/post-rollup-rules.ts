import * as text from "../../../../kit/text.js";
import { PostRollup } from "./post-rollup.js";

/** A rule a post rollup must pass. Check returns its problems, or none. */
export interface PostRollupRule {
  check(item: PostRollup): string[];
}

export class PostRollupRequiredCodeRule implements PostRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PostRollup): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PostRollupNameLengthRule implements PostRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PostRollup): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PostRollupAllowedTimezoneRule implements PostRollupRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PostRollup): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.timezone))) return [`timezone ${item.timezone} is inconsistent`];
    return [];
  }
}

export class PostRollupCodeLengthRule implements PostRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PostRollup): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a post rollup. */
export class PostRollupValidator {
  rules: PostRollupRule[];

  constructor(rules: PostRollupRule[]) {
    this.rules = rules;
  }

  validate(item: PostRollup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PostRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PostRollup[]): Map<string, string[]> {
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

export function defaultPostRollupValidator(): PostRollupValidator {
  return new PostRollupValidator(
    [
      new PostRollupRequiredCodeRule("post rollup needs an entry"),
      new PostRollupNameLengthRule(80),
      new PostRollupAllowedTimezoneRule(["weighted", "manual"]),
      new PostRollupCodeLengthRule(80),
    ],
  );
}
