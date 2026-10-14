import * as text from "../../../../kit/text.js";
import { ManualTierPolicy } from "./manual-tier-policy.js";

/** A rule a manual tier policy must pass. Check returns its problems, or none. */
export interface ManualTierPolicyRule {
  check(item: ManualTierPolicy): string[];
}

export class ManualTierPolicyAmountRangeRule implements ManualTierPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualTierPolicy): string[] {
    const value = item.amount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`amount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`amount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ManualTierPolicyRequiredNameRule implements ManualTierPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualTierPolicy): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class ManualTierPolicyAllowedContactEmailRule implements ManualTierPolicyRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ManualTierPolicy): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.contactEmail))) return [`contact email ${item.contactEmail} is below minimum`];
    return [];
  }
}

export class ManualTierPolicyRequiredLocaleRule implements ManualTierPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualTierPolicy): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class ManualTierPolicyCohortLengthRule implements ManualTierPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualTierPolicy): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualTierPolicyLocaleLengthRule implements ManualTierPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualTierPolicy): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a manual tier policy. */
export class ManualTierPolicyValidator {
  rules: ManualTierPolicyRule[];

  constructor(rules: ManualTierPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: ManualTierPolicy): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualTierPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualTierPolicy[]): Map<string, string[]> {
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

export function defaultManualTierPolicyValidator(): ManualTierPolicyValidator {
  return new ManualTierPolicyValidator(
    [
      new ManualTierPolicyAmountRangeRule(10, 3504.3),
      new ManualTierPolicyRequiredNameRule("manual tier policy needs an entry"),
      new ManualTierPolicyAllowedContactEmailRule([]),
      new ManualTierPolicyRequiredLocaleRule("manual tier policy needs this field"),
      new ManualTierPolicyCohortLengthRule(120),
      new ManualTierPolicyLocaleLengthRule(80),
    ],
  );
}
