import * as text from "../../../../kit/text.js";
import { TieredExitRuleDigest } from "./tiered-exit-rule-digest.js";

/** A rule a tiered exit rule digest must pass. Check returns its problems, or none. */
export interface TieredExitRuleDigestRule {
  check(item: TieredExitRuleDigest): string[];
}

export class TieredExitRuleDigestNameLengthRule implements TieredExitRuleDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredExitRuleDigest): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredExitRuleDigestImpressionsRangeRule implements TieredExitRuleDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredExitRuleDigest): string[] {
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

export class TieredExitRuleDigestCountryLengthRule implements TieredExitRuleDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredExitRuleDigest): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredExitRuleDigestAllowedNameRule implements TieredExitRuleDigestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TieredExitRuleDigest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is not allowed`];
    return [];
  }
}

export class TieredExitRuleDigestRequiredCountryRule implements TieredExitRuleDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredExitRuleDigest): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a tiered exit rule digest. */
export class TieredExitRuleDigestValidator {
  rules: TieredExitRuleDigestRule[];

  constructor(rules: TieredExitRuleDigestRule[]) {
    this.rules = rules;
  }

  validate(item: TieredExitRuleDigest): string[] {
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

  requireValid(item: TieredExitRuleDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredExitRuleDigest[]): Map<string, string[]> {
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

export function defaultTieredExitRuleDigestValidator(): TieredExitRuleDigestValidator {
  return new TieredExitRuleDigestValidator(
    [
      new TieredExitRuleDigestNameLengthRule(32),
      new TieredExitRuleDigestImpressionsRangeRule(80, 255),
      new TieredExitRuleDigestCountryLengthRule(3600),
      new TieredExitRuleDigestAllowedNameRule([]),
      new TieredExitRuleDigestRequiredCountryRule("tiered exit rule digest needs this field"),
    ],
  );
}
