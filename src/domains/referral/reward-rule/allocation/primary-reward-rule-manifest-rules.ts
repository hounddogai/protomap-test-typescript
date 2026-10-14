import * as text from "../../../../kit/text.js";
import { PrimaryRewardRuleManifest } from "./primary-reward-rule-manifest.js";

/** A rule a primary reward rule manifest must pass. Check returns its problems, or none. */
export interface PrimaryRewardRuleManifestRule {
  check(item: PrimaryRewardRuleManifest): string[];
}

export class PrimaryRewardRuleManifestRequiredCodeRule implements PrimaryRewardRuleManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryRewardRuleManifest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryRewardRuleManifestAllowedCurrencyRule implements PrimaryRewardRuleManifestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PrimaryRewardRuleManifest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.currency))) return [`currency ${item.currency} is blocked`];
    return [];
  }
}

export class PrimaryRewardRuleManifestPinnedGuardRule implements PrimaryRewardRuleManifestRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PrimaryRewardRuleManifest): string[] {
    if (item.pinned && item.quantity > this.limit) return [`quantity ${item.quantity} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class PrimaryRewardRuleManifestQuantityRangeRule implements PrimaryRewardRuleManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryRewardRuleManifest): string[] {
    const value = item.quantity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`quantity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`quantity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PrimaryRewardRuleManifestExternalRefLengthRule implements PrimaryRewardRuleManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryRewardRuleManifest): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryRewardRuleManifestRequiredCurrencyRule implements PrimaryRewardRuleManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryRewardRuleManifest): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a primary reward rule manifest. */
export class PrimaryRewardRuleManifestValidator {
  rules: PrimaryRewardRuleManifestRule[];

  constructor(rules: PrimaryRewardRuleManifestRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryRewardRuleManifest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryRewardRuleManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryRewardRuleManifest[]): Map<string, string[]> {
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

export function defaultPrimaryRewardRuleManifestValidator(): PrimaryRewardRuleManifestValidator {
  return new PrimaryRewardRuleManifestValidator(
    [
      new PrimaryRewardRuleManifestRequiredCodeRule("primary reward rule manifest needs this field"),
      new PrimaryRewardRuleManifestAllowedCurrencyRule(["adaptive", "rolling", "strict"]),
      new PrimaryRewardRuleManifestPinnedGuardRule(80),
      new PrimaryRewardRuleManifestQuantityRangeRule(255, 1000),
      new PrimaryRewardRuleManifestExternalRefLengthRule(86400),
      new PrimaryRewardRuleManifestRequiredCurrencyRule("primary reward rule manifest needs this field"),
    ],
  );
}
