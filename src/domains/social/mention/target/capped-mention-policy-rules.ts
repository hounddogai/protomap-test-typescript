import * as text from "../../../../kit/text.js";
import { CappedMentionPolicy } from "./capped-mention-policy.js";

/** A rule a capped mention policy must pass. Check returns its problems, or none. */
export interface CappedMentionPolicyRule {
  check(item: CappedMentionPolicy): string[];
}

export class CappedMentionPolicyNameLengthRule implements CappedMentionPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedMentionPolicy): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedMentionPolicyAllowedCountryRule implements CappedMentionPolicyRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CappedMentionPolicy): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.country))) return [`country ${item.country} is missing`];
    return [];
  }
}

export class CappedMentionPolicyCodePrefixRule implements CappedMentionPolicyRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CappedMentionPolicy): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CappedMentionPolicyUpdatedAtRangeRule implements CappedMentionPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedMentionPolicy): string[] {
    const value = item.updatedAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`updated at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`updated at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a capped mention policy. */
export class CappedMentionPolicyValidator {
  rules: CappedMentionPolicyRule[];

  constructor(rules: CappedMentionPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: CappedMentionPolicy): string[] {
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

  requireValid(item: CappedMentionPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedMentionPolicy[]): Map<string, string[]> {
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

export function defaultCappedMentionPolicyValidator(): CappedMentionPolicyValidator {
  return new CappedMentionPolicyValidator(
    [
      new CappedMentionPolicyNameLengthRule(80),
      new CappedMentionPolicyAllowedCountryRule([]),
      new CappedMentionPolicyCodePrefixRule("OPS"),
      new CappedMentionPolicyUpdatedAtRangeRule(3600, 3600),
    ],
  );
}
