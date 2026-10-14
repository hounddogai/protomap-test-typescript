import * as text from "../../../../kit/text.js";
import { WeightedMentionDigest } from "./weighted-mention-digest.js";

/** A rule a weighted mention digest must pass. Check returns its problems, or none. */
export interface WeightedMentionDigestRule {
  check(item: WeightedMentionDigest): string[];
}

export class WeightedMentionDigestRequiredNotesRule implements WeightedMentionDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedMentionDigest): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedMentionDigestAllowedTitleRule implements WeightedMentionDigestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WeightedMentionDigest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is stale`];
    return [];
  }
}

export class WeightedMentionDigestCodePrefixRule implements WeightedMentionDigestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WeightedMentionDigest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WeightedMentionDigestRequiredTitleRule implements WeightedMentionDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedMentionDigest): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedMentionDigestCeilingRangeRule implements WeightedMentionDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedMentionDigest): string[] {
    const value = item.ceiling;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ceiling ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ceiling ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WeightedMentionDigestCodeLengthRule implements WeightedMentionDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedMentionDigest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a weighted mention digest. */
export class WeightedMentionDigestValidator {
  rules: WeightedMentionDigestRule[];

  constructor(rules: WeightedMentionDigestRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedMentionDigest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedMentionDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedMentionDigest[]): Map<string, string[]> {
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

export function defaultWeightedMentionDigestValidator(): WeightedMentionDigestValidator {
  return new WeightedMentionDigestValidator(
    [
      new WeightedMentionDigestRequiredNotesRule("weighted mention digest needs an entry"),
      new WeightedMentionDigestAllowedTitleRule(["rolling", "tiered"]),
      new WeightedMentionDigestCodePrefixRule("OPS"),
      new WeightedMentionDigestRequiredTitleRule("weighted mention digest needs an entry"),
      new WeightedMentionDigestCeilingRangeRule(0.2, 3218.7),
      new WeightedMentionDigestCodeLengthRule(1000),
    ],
  );
}
