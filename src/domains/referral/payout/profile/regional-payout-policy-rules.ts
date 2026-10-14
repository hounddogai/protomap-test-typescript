import * as text from "../../../../kit/text.js";
import { RegionalPayoutPolicy } from "./regional-payout-policy.js";

/** A rule a regional payout policy must pass. Check returns its problems, or none. */
export interface RegionalPayoutPolicyRule {
  check(item: RegionalPayoutPolicy): string[];
}

export class RegionalPayoutPolicyThresholdRangeRule implements RegionalPayoutPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalPayoutPolicy): string[] {
    const value = item.threshold;
    if (value < this.min || value > this.max) return [`threshold ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RegionalPayoutPolicyContactEmailLengthRule implements RegionalPayoutPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalPayoutPolicy): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalPayoutPolicyCodePrefixRule implements RegionalPayoutPolicyRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RegionalPayoutPolicy): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RegionalPayoutPolicyAllowedCodeRule implements RegionalPayoutPolicyRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RegionalPayoutPolicy): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is inconsistent`];
    return [];
  }
}

/** Runs every rule of a regional payout policy. */
export class RegionalPayoutPolicyValidator {
  rules: RegionalPayoutPolicyRule[];

  constructor(rules: RegionalPayoutPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalPayoutPolicy): string[] {
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

  requireValid(item: RegionalPayoutPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalPayoutPolicy[]): Map<string, string[]> {
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

export function defaultRegionalPayoutPolicyValidator(): RegionalPayoutPolicyValidator {
  return new RegionalPayoutPolicyValidator(
    [
      new RegionalPayoutPolicyThresholdRangeRule(0.4, 1622.5),
      new RegionalPayoutPolicyContactEmailLengthRule(80),
      new RegionalPayoutPolicyCodePrefixRule("Q"),
      new RegionalPayoutPolicyAllowedCodeRule([]),
    ],
  );
}
