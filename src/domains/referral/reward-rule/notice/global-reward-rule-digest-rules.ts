import * as text from "../../../../kit/text.js";
import { GlobalRewardRuleDigest } from "./global-reward-rule-digest.js";

/** A rule a global reward rule digest must pass. Check returns its problems, or none. */
export interface GlobalRewardRuleDigestRule {
  check(item: GlobalRewardRuleDigest): string[];
}

export class GlobalRewardRuleDigestRequiredCodeRule implements GlobalRewardRuleDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalRewardRuleDigest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalRewardRuleDigestLabelLengthRule implements GlobalRewardRuleDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalRewardRuleDigest): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalRewardRuleDigestImpressionsRangeRule implements GlobalRewardRuleDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalRewardRuleDigest): string[] {
    const value = item.impressions;
    if (value < this.min || value > this.max) return [`impressions ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class GlobalRewardRuleDigestAllowedLabelRule implements GlobalRewardRuleDigestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: GlobalRewardRuleDigest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is too long`];
    return [];
  }
}

/** Runs every rule of a global reward rule digest. */
export class GlobalRewardRuleDigestValidator {
  rules: GlobalRewardRuleDigestRule[];

  constructor(rules: GlobalRewardRuleDigestRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalRewardRuleDigest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalRewardRuleDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalRewardRuleDigest[]): Map<string, string[]> {
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

export function defaultGlobalRewardRuleDigestValidator(): GlobalRewardRuleDigestValidator {
  return new GlobalRewardRuleDigestValidator(
    [
      new GlobalRewardRuleDigestRequiredCodeRule("global reward rule digest needs an entry"),
      new GlobalRewardRuleDigestLabelLengthRule(86400),
      new GlobalRewardRuleDigestImpressionsRangeRule(16, 86400),
      new GlobalRewardRuleDigestAllowedLabelRule(["default"]),
    ],
  );
}
