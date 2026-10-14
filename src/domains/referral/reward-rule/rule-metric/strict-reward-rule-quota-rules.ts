import * as text from "../../../../kit/text.js";
import { StrictRewardRuleQuota } from "./strict-reward-rule-quota.js";

/** A rule a strict reward rule quota must pass. Check returns its problems, or none. */
export interface StrictRewardRuleQuotaRule {
  check(item: StrictRewardRuleQuota): string[];
}

export class StrictRewardRuleQuotaRevisionRangeRule implements StrictRewardRuleQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictRewardRuleQuota): string[] {
    const value = item.revision;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`revision ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`revision ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StrictRewardRuleQuotaRequiredCodeRule implements StrictRewardRuleQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictRewardRuleQuota): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class StrictRewardRuleQuotaImpressionsRangeRule implements StrictRewardRuleQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictRewardRuleQuota): string[] {
    const value = item.impressions;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`impressions ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`impressions ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StrictRewardRuleQuotaRequiredNameRule implements StrictRewardRuleQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictRewardRuleQuota): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class StrictRewardRuleQuotaPhoneLengthRule implements StrictRewardRuleQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictRewardRuleQuota): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictRewardRuleQuotaAllowedPhoneRule implements StrictRewardRuleQuotaRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StrictRewardRuleQuota): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.phone))) return [`phone ${item.phone} is stale`];
    return [];
  }
}

/** Runs every rule of a strict reward rule quota. */
export class StrictRewardRuleQuotaValidator {
  rules: StrictRewardRuleQuotaRule[];

  constructor(rules: StrictRewardRuleQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: StrictRewardRuleQuota): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StrictRewardRuleQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictRewardRuleQuota[]): Map<string, string[]> {
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

export function defaultStrictRewardRuleQuotaValidator(): StrictRewardRuleQuotaValidator {
  return new StrictRewardRuleQuotaValidator(
    [
      new StrictRewardRuleQuotaRevisionRangeRule(80, 86400),
      new StrictRewardRuleQuotaRequiredCodeRule("strict reward rule quota needs this field"),
      new StrictRewardRuleQuotaImpressionsRangeRule(16, 64),
      new StrictRewardRuleQuotaRequiredNameRule("strict reward rule quota needs an entry"),
      new StrictRewardRuleQuotaPhoneLengthRule(120),
      new StrictRewardRuleQuotaAllowedPhoneRule(["strict"]),
    ],
  );
}
