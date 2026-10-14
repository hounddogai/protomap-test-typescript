import * as text from "../../../../kit/text.js";
import { StrictSenderDigest } from "./strict-sender-digest.js";

/** A rule a strict sender digest must pass. Check returns its problems, or none. */
export interface StrictSenderDigestRule {
  check(item: StrictSenderDigest): string[];
}

export class StrictSenderDigestScoreRangeRule implements StrictSenderDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictSenderDigest): string[] {
    const value = item.score;
    if (value < this.min || value > this.max) return [`score ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StrictSenderDigestRequiredTitleRule implements StrictSenderDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictSenderDigest): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class StrictSenderDigestSegmentLengthRule implements StrictSenderDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictSenderDigest): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictSenderDigestAllowedSegmentRule implements StrictSenderDigestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StrictSenderDigest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.segment))) return [`segment ${item.segment} is above maximum`];
    return [];
  }
}

export class StrictSenderDigestCategoryLengthRule implements StrictSenderDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictSenderDigest): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictSenderDigestCodePrefixRule implements StrictSenderDigestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StrictSenderDigest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a strict sender digest. */
export class StrictSenderDigestValidator {
  rules: StrictSenderDigestRule[];

  constructor(rules: StrictSenderDigestRule[]) {
    this.rules = rules;
  }

  validate(item: StrictSenderDigest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StrictSenderDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictSenderDigest[]): Map<string, string[]> {
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

export function defaultStrictSenderDigestValidator(): StrictSenderDigestValidator {
  return new StrictSenderDigestValidator(
    [
      new StrictSenderDigestScoreRangeRule(7.2, 1671),
      new StrictSenderDigestRequiredTitleRule("strict sender digest needs an entry"),
      new StrictSenderDigestSegmentLengthRule(3600),
      new StrictSenderDigestAllowedSegmentRule(["tiered", "adaptive"]),
      new StrictSenderDigestCategoryLengthRule(64),
      new StrictSenderDigestCodePrefixRule("ACM"),
    ],
  );
}
