import { BidRuleClaim } from "./bid-rule-claim.js";

/** A rule a bid rule claim must pass. Check returns its problems, or none. */
export interface BidRuleClaimRule {
  check(item: BidRuleClaim): string[];
}

export class BidRuleClaimQuantityRangeRule implements BidRuleClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BidRuleClaim): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BidRuleClaimCodePrefixRule implements BidRuleClaimRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BidRuleClaim): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BidRuleClaimApprovedGuardRule implements BidRuleClaimRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: BidRuleClaim): string[] {
    if (item.approved && item.quantity > this.limit) return [`quantity ${item.quantity} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class BidRuleClaimCodeLengthRule implements BidRuleClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BidRuleClaim): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BidRuleClaimRequiredCodeRule implements BidRuleClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BidRuleClaim): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a bid rule claim. */
export class BidRuleClaimValidator {
  rules: BidRuleClaimRule[];

  constructor(rules: BidRuleClaimRule[]) {
    this.rules = rules;
  }

  validate(item: BidRuleClaim): string[] {
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

  requireValid(item: BidRuleClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BidRuleClaim[]): Map<string, string[]> {
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

export function defaultBidRuleClaimValidator(): BidRuleClaimValidator {
  return new BidRuleClaimValidator(
    [
      new BidRuleClaimQuantityRangeRule(255, 3600),
      new BidRuleClaimCodePrefixRule("ACM"),
      new BidRuleClaimApprovedGuardRule(16),
      new BidRuleClaimCodeLengthRule(3600),
      new BidRuleClaimRequiredCodeRule("bid rule claim needs this field"),
    ],
  );
}
