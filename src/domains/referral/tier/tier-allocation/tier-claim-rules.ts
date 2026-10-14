import * as text from "../../../../kit/text.js";
import { TierClaim } from "./tier-claim.js";

/** A rule a tier claim must pass. Check returns its problems, or none. */
export interface TierClaimRule {
  check(item: TierClaim): string[];
}

export class TierClaimAllowedCampaignRefRule implements TierClaimRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TierClaim): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.campaignRef))) return [`campaign ref ${item.campaignRef} is not allowed`];
    return [];
  }
}

export class TierClaimAmountRangeRule implements TierClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TierClaim): string[] {
    const value = item.amount;
    if (value < this.min || value > this.max) return [`amount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TierClaimTitleLengthRule implements TierClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TierClaim): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TierClaimRequiredNameRule implements TierClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TierClaim): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class TierClaimRequiredCodeRule implements TierClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TierClaim): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a tier claim. */
export class TierClaimValidator {
  rules: TierClaimRule[];

  constructor(rules: TierClaimRule[]) {
    this.rules = rules;
  }

  validate(item: TierClaim): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TierClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TierClaim[]): Map<string, string[]> {
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

export function defaultTierClaimValidator(): TierClaimValidator {
  return new TierClaimValidator(
    [
      new TierClaimAllowedCampaignRefRule(["primary", "adaptive", "pending"]),
      new TierClaimAmountRangeRule(9.2, 3548.9),
      new TierClaimTitleLengthRule(32),
      new TierClaimRequiredNameRule("tier claim needs a value"),
      new TierClaimRequiredCodeRule("tier claim needs this field"),
    ],
  );
}
