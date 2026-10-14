import * as text from "../../../../kit/text.js";
import { WeightedRewardRuleDigest } from "./weighted-reward-rule-digest.js";

/** A rule a weighted reward rule digest must pass. Check returns its problems, or none. */
export interface WeightedRewardRuleDigestRule {
  check(item: WeightedRewardRuleDigest): string[];
}

export class WeightedRewardRuleDigestCodePrefixRule implements WeightedRewardRuleDigestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WeightedRewardRuleDigest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WeightedRewardRuleDigestLocaleLengthRule implements WeightedRewardRuleDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedRewardRuleDigest): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedRewardRuleDigestRequiredLocaleRule implements WeightedRewardRuleDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedRewardRuleDigest): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedRewardRuleDigestChecksumLengthRule implements WeightedRewardRuleDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedRewardRuleDigest): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedRewardRuleDigestAllowedLocaleRule implements WeightedRewardRuleDigestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WeightedRewardRuleDigest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.locale))) return [`locale ${item.locale} is below minimum`];
    return [];
  }
}

/** Runs every rule of a weighted reward rule digest. */
export class WeightedRewardRuleDigestValidator {
  rules: WeightedRewardRuleDigestRule[];

  constructor(rules: WeightedRewardRuleDigestRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedRewardRuleDigest): string[] {
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

  requireValid(item: WeightedRewardRuleDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedRewardRuleDigest[]): Map<string, string[]> {
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

export function defaultWeightedRewardRuleDigestValidator(): WeightedRewardRuleDigestValidator {
  return new WeightedRewardRuleDigestValidator(
    [
      new WeightedRewardRuleDigestCodePrefixRule("ACM"),
      new WeightedRewardRuleDigestLocaleLengthRule(120),
      new WeightedRewardRuleDigestRequiredLocaleRule("weighted reward rule digest needs this field"),
      new WeightedRewardRuleDigestChecksumLengthRule(255),
      new WeightedRewardRuleDigestAllowedLocaleRule([]),
    ],
  );
}
