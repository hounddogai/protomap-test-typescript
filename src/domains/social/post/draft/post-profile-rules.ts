import * as text from "../../../../kit/text.js";
import { PostProfile } from "./post-profile.js";

/** A rule a post profile must pass. Check returns its problems, or none. */
export interface PostProfileRule {
  check(item: PostProfile): string[];
}

export class PostProfileAllowedCodeRule implements PostProfileRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PostProfile): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is duplicated`];
    return [];
  }
}

export class PostProfileLabelLengthRule implements PostProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PostProfile): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PostProfileRequiredCodeRule implements PostProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PostProfile): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PostProfileRequiredLabelRule implements PostProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PostProfile): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a post profile. */
export class PostProfileValidator {
  rules: PostProfileRule[];

  constructor(rules: PostProfileRule[]) {
    this.rules = rules;
  }

  validate(item: PostProfile): string[] {
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

  requireValid(item: PostProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PostProfile[]): Map<string, string[]> {
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

export function defaultPostProfileValidator(): PostProfileValidator {
  return new PostProfileValidator(
    [
      new PostProfileAllowedCodeRule(["rolling"]),
      new PostProfileLabelLengthRule(1000),
      new PostProfileRequiredCodeRule("post profile needs a value"),
      new PostProfileRequiredLabelRule("post profile needs an entry"),
    ],
  );
}
