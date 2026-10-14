import { RewardRuleQuota } from "./reward-rule-quota.js";

/** A rule a reward rule quota must pass. Check returns its problems, or none. */
export interface RewardRuleQuotaRule {
  check(item: RewardRuleQuota): string[];
}

export class RewardRuleQuotaLabelLengthRule implements RewardRuleQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardRuleQuota): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RewardRuleQuotaRequiredUtmSourceRule implements RewardRuleQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardRuleQuota): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

export class RewardRuleQuotaRequiredCampaignRefRule implements RewardRuleQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardRuleQuota): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class RewardRuleQuotaRequiredLabelRule implements RewardRuleQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardRuleQuota): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a reward rule quota. */
export class RewardRuleQuotaValidator {
  rules: RewardRuleQuotaRule[];

  constructor(rules: RewardRuleQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: RewardRuleQuota): string[] {
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

  requireValid(item: RewardRuleQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RewardRuleQuota[]): Map<string, string[]> {
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

export function defaultRewardRuleQuotaValidator(): RewardRuleQuotaValidator {
  return new RewardRuleQuotaValidator(
    [
      new RewardRuleQuotaLabelLengthRule(255),
      new RewardRuleQuotaRequiredUtmSourceRule("reward rule quota needs a value"),
      new RewardRuleQuotaRequiredCampaignRefRule("reward rule quota needs a value"),
      new RewardRuleQuotaRequiredLabelRule("reward rule quota needs this field"),
    ],
  );
}
