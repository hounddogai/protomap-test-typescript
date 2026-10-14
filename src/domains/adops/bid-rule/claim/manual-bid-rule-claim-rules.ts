import { ManualBidRuleClaim } from "./manual-bid-rule-claim.js";

/** A rule a manual bid rule claim must pass. Check returns its problems, or none. */
export interface ManualBidRuleClaimRule {
  check(item: ManualBidRuleClaim): string[];
}

export class ManualBidRuleClaimCodePrefixRule implements ManualBidRuleClaimRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ManualBidRuleClaim): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ManualBidRuleClaimImpressionsRangeRule implements ManualBidRuleClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualBidRuleClaim): string[] {
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

export class ManualBidRuleClaimLocaleLengthRule implements ManualBidRuleClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualBidRuleClaim): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a manual bid rule claim. */
export class ManualBidRuleClaimValidator {
  rules: ManualBidRuleClaimRule[];

  constructor(rules: ManualBidRuleClaimRule[]) {
    this.rules = rules;
  }

  validate(item: ManualBidRuleClaim): string[] {
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

  requireValid(item: ManualBidRuleClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualBidRuleClaim[]): Map<string, string[]> {
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

export function defaultManualBidRuleClaimValidator(): ManualBidRuleClaimValidator {
  return new ManualBidRuleClaimValidator(
    [
      new ManualBidRuleClaimCodePrefixRule("Q"),
      new ManualBidRuleClaimImpressionsRangeRule(64, 86400),
      new ManualBidRuleClaimLocaleLengthRule(3600),
    ],
  );
}
