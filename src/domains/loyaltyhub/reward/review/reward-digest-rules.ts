import * as text from "../../../../kit/text.js";
import { RewardDigest } from "./reward-digest.js";

/** A rule a reward digest must pass. Check returns its problems, or none. */
export interface RewardDigestRule {
  check(item: RewardDigest): string[];
}

export class RewardDigestCodeLengthRule implements RewardDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardDigest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RewardDigestAttemptsRangeRule implements RewardDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RewardDigest): string[] {
    const value = item.attempts;
    if (value < this.min || value > this.max) return [`attempts ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RewardDigestCodePrefixRule implements RewardDigestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RewardDigest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RewardDigestCountryLengthRule implements RewardDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardDigest): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RewardDigestAllowedCodeRule implements RewardDigestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RewardDigest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is duplicated`];
    return [];
  }
}

/** Runs every rule of a reward digest. */
export class RewardDigestValidator {
  rules: RewardDigestRule[];

  constructor(rules: RewardDigestRule[]) {
    this.rules = rules;
  }

  validate(item: RewardDigest): string[] {
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

  requireValid(item: RewardDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RewardDigest[]): Map<string, string[]> {
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

export function defaultRewardDigestValidator(): RewardDigestValidator {
  return new RewardDigestValidator(
    [
      new RewardDigestCodeLengthRule(255),
      new RewardDigestAttemptsRangeRule(64, 86400),
      new RewardDigestCodePrefixRule("OPS"),
      new RewardDigestCountryLengthRule(120),
      new RewardDigestAllowedCodeRule([]),
    ],
  );
}
