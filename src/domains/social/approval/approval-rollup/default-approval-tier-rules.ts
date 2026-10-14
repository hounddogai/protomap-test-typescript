import * as text from "../../../../kit/text.js";
import { DefaultApprovalTier } from "./default-approval-tier.js";

/** A rule a default approval tier must pass. Check returns its problems, or none. */
export interface DefaultApprovalTierRule {
  check(item: DefaultApprovalTier): string[];
}

export class DefaultApprovalTierAllowedLocaleRule implements DefaultApprovalTierRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DefaultApprovalTier): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.locale))) return [`locale ${item.locale} is unknown`];
    return [];
  }
}

export class DefaultApprovalTierVersionRangeRule implements DefaultApprovalTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultApprovalTier): string[] {
    const value = item.version;
    if (value < this.min || value > this.max) return [`version ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DefaultApprovalTierRequiredCurrencyRule implements DefaultApprovalTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultApprovalTier): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultApprovalTierRequiredCampaignRefRule implements DefaultApprovalTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultApprovalTier): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultApprovalTierCodePrefixRule implements DefaultApprovalTierRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DefaultApprovalTier): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a default approval tier. */
export class DefaultApprovalTierValidator {
  rules: DefaultApprovalTierRule[];

  constructor(rules: DefaultApprovalTierRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultApprovalTier): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DefaultApprovalTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultApprovalTier[]): Map<string, string[]> {
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

export function defaultDefaultApprovalTierValidator(): DefaultApprovalTierValidator {
  return new DefaultApprovalTierValidator(
    [
      new DefaultApprovalTierAllowedLocaleRule(["pending"]),
      new DefaultApprovalTierVersionRangeRule(32, 86400),
      new DefaultApprovalTierRequiredCurrencyRule("default approval tier needs this field"),
      new DefaultApprovalTierRequiredCampaignRefRule("default approval tier needs this field"),
      new DefaultApprovalTierCodePrefixRule("X"),
    ],
  );
}
