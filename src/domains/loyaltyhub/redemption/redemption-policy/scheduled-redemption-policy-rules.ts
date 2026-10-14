import { ScheduledRedemptionPolicy } from "./scheduled-redemption-policy.js";

/** A rule a scheduled redemption policy must pass. Check returns its problems, or none. */
export interface ScheduledRedemptionPolicyRule {
  check(item: ScheduledRedemptionPolicy): string[];
}

export class ScheduledRedemptionPolicyRequiredCodeRule implements ScheduledRedemptionPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledRedemptionPolicy): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledRedemptionPolicyCodeLengthRule implements ScheduledRedemptionPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledRedemptionPolicy): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledRedemptionPolicyRequiredCampaignRefRule implements ScheduledRedemptionPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledRedemptionPolicy): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledRedemptionPolicyPhoneLengthRule implements ScheduledRedemptionPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledRedemptionPolicy): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a scheduled redemption policy. */
export class ScheduledRedemptionPolicyValidator {
  rules: ScheduledRedemptionPolicyRule[];

  constructor(rules: ScheduledRedemptionPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledRedemptionPolicy): string[] {
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

  requireValid(item: ScheduledRedemptionPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledRedemptionPolicy[]): Map<string, string[]> {
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

export function defaultScheduledRedemptionPolicyValidator(): ScheduledRedemptionPolicyValidator {
  return new ScheduledRedemptionPolicyValidator(
    [
      new ScheduledRedemptionPolicyRequiredCodeRule("scheduled redemption policy needs an entry"),
      new ScheduledRedemptionPolicyCodeLengthRule(255),
      new ScheduledRedemptionPolicyRequiredCampaignRefRule("scheduled redemption policy needs this field"),
      new ScheduledRedemptionPolicyPhoneLengthRule(120),
    ],
  );
}
