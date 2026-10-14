import * as text from "../../../../kit/text.js";
import { TierPolicy } from "./tier-policy.js";

/** A rule a tier policy must pass. Check returns its problems, or none. */
export interface TierPolicyRule {
  check(item: TierPolicy): string[];
}

export class TierPolicyGraceDaysRangeRule implements TierPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TierPolicy): string[] {
    const value = item.graceDays;
    if (value < this.min || value > this.max) return [`grace days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TierPolicyAllowedLabelRule implements TierPolicyRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TierPolicy): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is below minimum`];
    return [];
  }
}

export class TierPolicyCodePrefixRule implements TierPolicyRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TierPolicy): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class TierPolicyRequiredLabelRule implements TierPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TierPolicy): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a tier policy. */
export class TierPolicyValidator {
  rules: TierPolicyRule[];

  constructor(rules: TierPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: TierPolicy): string[] {
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

  requireValid(item: TierPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TierPolicy[]): Map<string, string[]> {
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

export function defaultTierPolicyValidator(): TierPolicyValidator {
  return new TierPolicyValidator(
    [
      new TierPolicyGraceDaysRangeRule(32, 1000),
      new TierPolicyAllowedLabelRule(["scheduled"]),
      new TierPolicyCodePrefixRule("ACM"),
      new TierPolicyRequiredLabelRule("tier policy needs a value"),
    ],
  );
}
