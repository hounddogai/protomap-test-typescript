import * as text from "../../../../kit/text.js";
import { RegionalRedemptionGroup } from "./regional-redemption-group.js";

/** A rule a regional redemption group must pass. Check returns its problems, or none. */
export interface RegionalRedemptionGroupRule {
  check(item: RegionalRedemptionGroup): string[];
}

export class RegionalRedemptionGroupAllowedNameRule implements RegionalRedemptionGroupRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RegionalRedemptionGroup): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is above maximum`];
    return [];
  }
}

export class RegionalRedemptionGroupRequiredCountryRule implements RegionalRedemptionGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalRedemptionGroup): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalRedemptionGroupCountryLengthRule implements RegionalRedemptionGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalRedemptionGroup): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalRedemptionGroupRequiredCodeRule implements RegionalRedemptionGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalRedemptionGroup): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalRedemptionGroupRequiredNameRule implements RegionalRedemptionGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalRedemptionGroup): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalRedemptionGroupEndsAtRangeRule implements RegionalRedemptionGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalRedemptionGroup): string[] {
    const value = item.endsAt;
    if (value < this.min || value > this.max) return [`ends at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a regional redemption group. */
export class RegionalRedemptionGroupValidator {
  rules: RegionalRedemptionGroupRule[];

  constructor(rules: RegionalRedemptionGroupRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalRedemptionGroup): string[] {
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

  requireValid(item: RegionalRedemptionGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalRedemptionGroup[]): Map<string, string[]> {
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

export function defaultRegionalRedemptionGroupValidator(): RegionalRedemptionGroupValidator {
  return new RegionalRedemptionGroupValidator(
    [
      new RegionalRedemptionGroupAllowedNameRule([]),
      new RegionalRedemptionGroupRequiredCountryRule("regional redemption group needs this field"),
      new RegionalRedemptionGroupCountryLengthRule(3600),
      new RegionalRedemptionGroupRequiredCodeRule("regional redemption group needs this field"),
      new RegionalRedemptionGroupRequiredNameRule("regional redemption group needs an entry"),
      new RegionalRedemptionGroupEndsAtRangeRule(64, 64),
    ],
  );
}
