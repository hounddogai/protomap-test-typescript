import * as text from "../../../../kit/text.js";
import { RewardClaim } from "./reward-claim.js";

/** A rule a reward claim must pass. Check returns its problems, or none. */
export interface RewardClaimRule {
  check(item: RewardClaim): string[];
}

export class RewardClaimAllowedCodeRule implements RewardClaimRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RewardClaim): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is above maximum`];
    return [];
  }
}

export class RewardClaimCodePrefixRule implements RewardClaimRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RewardClaim): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RewardClaimCodeLengthRule implements RewardClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardClaim): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RewardClaimTimezoneLengthRule implements RewardClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardClaim): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a reward claim. */
export class RewardClaimValidator {
  rules: RewardClaimRule[];

  constructor(rules: RewardClaimRule[]) {
    this.rules = rules;
  }

  validate(item: RewardClaim): string[] {
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

  requireValid(item: RewardClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RewardClaim[]): Map<string, string[]> {
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

export function defaultRewardClaimValidator(): RewardClaimValidator {
  return new RewardClaimValidator(
    [
      new RewardClaimAllowedCodeRule(["seasonal"]),
      new RewardClaimCodePrefixRule("ACM"),
      new RewardClaimCodeLengthRule(32),
      new RewardClaimTimezoneLengthRule(64),
    ],
  );
}
