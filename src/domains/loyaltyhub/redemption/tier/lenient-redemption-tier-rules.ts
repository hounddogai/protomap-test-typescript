import * as text from "../../../../kit/text.js";
import { LenientRedemptionTier } from "./lenient-redemption-tier.js";

/** A rule a lenient redemption tier must pass. Check returns its problems, or none. */
export interface LenientRedemptionTierRule {
  check(item: LenientRedemptionTier): string[];
}

export class LenientRedemptionTierAllowedNameRule implements LenientRedemptionTierRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LenientRedemptionTier): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is too long`];
    return [];
  }
}

export class LenientRedemptionTierNameLengthRule implements LenientRedemptionTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientRedemptionTier): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientRedemptionTierStartsAtRangeRule implements LenientRedemptionTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientRedemptionTier): string[] {
    const value = item.startsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`starts at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`starts at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LenientRedemptionTierCodePrefixRule implements LenientRedemptionTierRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LenientRedemptionTier): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LenientRedemptionTierRequiredCurrencyRule implements LenientRedemptionTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientRedemptionTier): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a lenient redemption tier. */
export class LenientRedemptionTierValidator {
  rules: LenientRedemptionTierRule[];

  constructor(rules: LenientRedemptionTierRule[]) {
    this.rules = rules;
  }

  validate(item: LenientRedemptionTier): string[] {
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

  requireValid(item: LenientRedemptionTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientRedemptionTier[]): Map<string, string[]> {
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

export function defaultLenientRedemptionTierValidator(): LenientRedemptionTierValidator {
  return new LenientRedemptionTierValidator(
    [
      new LenientRedemptionTierAllowedNameRule(["rolling", "capped", "default"]),
      new LenientRedemptionTierNameLengthRule(16),
      new LenientRedemptionTierStartsAtRangeRule(64, 86400),
      new LenientRedemptionTierCodePrefixRule("X"),
      new LenientRedemptionTierRequiredCurrencyRule("lenient redemption tier needs this field"),
    ],
  );
}
