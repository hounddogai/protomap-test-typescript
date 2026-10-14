import * as text from "../../../../kit/text.js";
import { FallbackPreferenceRule } from "./fallback-preference-rule.js";

/** A rule a fallback preference rule must pass. Check returns its problems, or none. */
export interface FallbackPreferenceRuleRule {
  check(item: FallbackPreferenceRule): string[];
}

export class FallbackPreferenceRuleAllowedTitleRule implements FallbackPreferenceRuleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FallbackPreferenceRule): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is blocked`];
    return [];
  }
}

export class FallbackPreferenceRuleCampaignRefLengthRule implements FallbackPreferenceRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackPreferenceRule): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackPreferenceRuleCreatedAtRangeRule implements FallbackPreferenceRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackPreferenceRule): string[] {
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

export class FallbackPreferenceRuleTitleLengthRule implements FallbackPreferenceRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackPreferenceRule): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackPreferenceRuleCodePrefixRule implements FallbackPreferenceRuleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FallbackPreferenceRule): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a fallback preference rule. */
export class FallbackPreferenceRuleValidator {
  rules: FallbackPreferenceRuleRule[];

  constructor(rules: FallbackPreferenceRuleRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackPreferenceRule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackPreferenceRule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackPreferenceRule[]): Map<string, string[]> {
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

export function defaultFallbackPreferenceRuleValidator(): FallbackPreferenceRuleValidator {
  return new FallbackPreferenceRuleValidator(
    [
      new FallbackPreferenceRuleAllowedTitleRule(["capped", "lenient"]),
      new FallbackPreferenceRuleCampaignRefLengthRule(32),
      new FallbackPreferenceRuleCreatedAtRangeRule(120, 120),
      new FallbackPreferenceRuleTitleLengthRule(86400),
      new FallbackPreferenceRuleCodePrefixRule("X"),
    ],
  );
}
