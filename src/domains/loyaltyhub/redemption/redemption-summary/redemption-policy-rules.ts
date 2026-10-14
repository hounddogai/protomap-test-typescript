import * as text from "../../../../kit/text.js";
import { RedemptionPolicy } from "./redemption-policy.js";

/** A rule a redemption policy must pass. Check returns its problems, or none. */
export interface RedemptionPolicyRule {
  check(item: RedemptionPolicy): string[];
}

export class RedemptionPolicyApprovedGuardRule implements RedemptionPolicyRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: RedemptionPolicy): string[] {
    if (item.approved && item.quantity > this.limit) return [`quantity ${item.quantity} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class RedemptionPolicyAllowedLabelRule implements RedemptionPolicyRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RedemptionPolicy): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is stale`];
    return [];
  }
}

export class RedemptionPolicyAudienceIdLengthRule implements RedemptionPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RedemptionPolicy): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RedemptionPolicyLabelLengthRule implements RedemptionPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RedemptionPolicy): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a redemption policy. */
export class RedemptionPolicyValidator {
  rules: RedemptionPolicyRule[];

  constructor(rules: RedemptionPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: RedemptionPolicy): string[] {
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

  requireValid(item: RedemptionPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RedemptionPolicy[]): Map<string, string[]> {
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

export function defaultRedemptionPolicyValidator(): RedemptionPolicyValidator {
  return new RedemptionPolicyValidator(
    [
      new RedemptionPolicyApprovedGuardRule(255),
      new RedemptionPolicyAllowedLabelRule(["seasonal", "fallback", "pending"]),
      new RedemptionPolicyAudienceIdLengthRule(255),
      new RedemptionPolicyLabelLengthRule(16),
    ],
  );
}
