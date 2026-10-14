import * as text from "../../../../kit/text.js";
import { PostPreference } from "./post-preference.js";

/** A rule a post preference must pass. Check returns its problems, or none. */
export interface PostPreferenceRule {
  check(item: PostPreference): string[];
}

export class PostPreferenceNotesLengthRule implements PostPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PostPreference): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PostPreferenceRequiredNameRule implements PostPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PostPreference): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class PostPreferenceRequiredNotesRule implements PostPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PostPreference): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

export class PostPreferenceAllowedNameRule implements PostPreferenceRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PostPreference): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is missing`];
    return [];
  }
}

export class PostPreferenceQuantityRangeRule implements PostPreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PostPreference): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PostPreferenceCodePrefixRule implements PostPreferenceRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PostPreference): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a post preference. */
export class PostPreferenceValidator {
  rules: PostPreferenceRule[];

  constructor(rules: PostPreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: PostPreference): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PostPreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PostPreference[]): Map<string, string[]> {
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

export function defaultPostPreferenceValidator(): PostPreferenceValidator {
  return new PostPreferenceValidator(
    [
      new PostPreferenceNotesLengthRule(3600),
      new PostPreferenceRequiredNameRule("post preference needs a value"),
      new PostPreferenceRequiredNotesRule("post preference needs this field"),
      new PostPreferenceAllowedNameRule(["tiered"]),
      new PostPreferenceQuantityRangeRule(16, 255),
      new PostPreferenceCodePrefixRule("X"),
    ],
  );
}
