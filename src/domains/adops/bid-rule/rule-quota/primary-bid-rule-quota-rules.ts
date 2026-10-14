import { PrimaryBidRuleQuota } from "./primary-bid-rule-quota.js";

/** A rule a primary bid rule quota must pass. Check returns its problems, or none. */
export interface PrimaryBidRuleQuotaRule {
  check(item: PrimaryBidRuleQuota): string[];
}

export class PrimaryBidRuleQuotaCodePrefixRule implements PrimaryBidRuleQuotaRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PrimaryBidRuleQuota): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PrimaryBidRuleQuotaCodeLengthRule implements PrimaryBidRuleQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryBidRuleQuota): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryBidRuleQuotaRequiredCodeRule implements PrimaryBidRuleQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryBidRuleQuota): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a primary bid rule quota. */
export class PrimaryBidRuleQuotaValidator {
  rules: PrimaryBidRuleQuotaRule[];

  constructor(rules: PrimaryBidRuleQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryBidRuleQuota): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryBidRuleQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryBidRuleQuota[]): Map<string, string[]> {
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

export function defaultPrimaryBidRuleQuotaValidator(): PrimaryBidRuleQuotaValidator {
  return new PrimaryBidRuleQuotaValidator(
    [
      new PrimaryBidRuleQuotaCodePrefixRule("Q"),
      new PrimaryBidRuleQuotaCodeLengthRule(16),
      new PrimaryBidRuleQuotaRequiredCodeRule("primary bid rule quota needs this field"),
    ],
  );
}
