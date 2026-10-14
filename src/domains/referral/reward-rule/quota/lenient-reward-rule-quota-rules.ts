import { LenientRewardRuleQuota } from "./lenient-reward-rule-quota.js";

/** A rule a lenient reward rule quota must pass. Check returns its problems, or none. */
export interface LenientRewardRuleQuotaRule {
  check(item: LenientRewardRuleQuota): string[];
}

export class LenientRewardRuleQuotaMinimumRangeRule implements LenientRewardRuleQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientRewardRuleQuota): string[] {
    const value = item.minimum;
    if (value < this.min || value > this.max) return [`minimum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientRewardRuleQuotaDiscountRangeRule implements LenientRewardRuleQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientRewardRuleQuota): string[] {
    const value = item.discount;
    if (value < this.min || value > this.max) return [`discount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientRewardRuleQuotaRequiredTitleRule implements LenientRewardRuleQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientRewardRuleQuota): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a lenient reward rule quota. */
export class LenientRewardRuleQuotaValidator {
  rules: LenientRewardRuleQuotaRule[];

  constructor(rules: LenientRewardRuleQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: LenientRewardRuleQuota): string[] {
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

  requireValid(item: LenientRewardRuleQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientRewardRuleQuota[]): Map<string, string[]> {
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

export function defaultLenientRewardRuleQuotaValidator(): LenientRewardRuleQuotaValidator {
  return new LenientRewardRuleQuotaValidator(
    [
      new LenientRewardRuleQuotaMinimumRangeRule(8.2, 4831.2),
      new LenientRewardRuleQuotaDiscountRangeRule(2.9, 762.6),
      new LenientRewardRuleQuotaRequiredTitleRule("lenient reward rule quota needs this field"),
    ],
  );
}
