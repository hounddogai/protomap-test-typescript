import * as text from "../../../../kit/text.js";
import { RegionalApprovalGroup } from "./regional-approval-group.js";

/** A rule a regional approval group must pass. Check returns its problems, or none. */
export interface RegionalApprovalGroupRule {
  check(item: RegionalApprovalGroup): string[];
}

export class RegionalApprovalGroupTitleLengthRule implements RegionalApprovalGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalApprovalGroup): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalApprovalGroupRequiredCodeRule implements RegionalApprovalGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalApprovalGroup): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalApprovalGroupAllowedTitleRule implements RegionalApprovalGroupRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RegionalApprovalGroup): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is unknown`];
    return [];
  }
}

export class RegionalApprovalGroupDiscountRangeRule implements RegionalApprovalGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalApprovalGroup): string[] {
    const value = item.discount;
    if (value < this.min || value > this.max) return [`discount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RegionalApprovalGroupRequiredTitleRule implements RegionalApprovalGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalApprovalGroup): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalApprovalGroupConversionRateRangeRule implements RegionalApprovalGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalApprovalGroup): string[] {
    const value = item.conversionRate;
    if (value < this.min || value > this.max) return [`conversion rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a regional approval group. */
export class RegionalApprovalGroupValidator {
  rules: RegionalApprovalGroupRule[];

  constructor(rules: RegionalApprovalGroupRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalApprovalGroup): string[] {
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

  requireValid(item: RegionalApprovalGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalApprovalGroup[]): Map<string, string[]> {
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

export function defaultRegionalApprovalGroupValidator(): RegionalApprovalGroupValidator {
  return new RegionalApprovalGroupValidator(
    [
      new RegionalApprovalGroupTitleLengthRule(3600),
      new RegionalApprovalGroupRequiredCodeRule("regional approval group needs this field"),
      new RegionalApprovalGroupAllowedTitleRule([]),
      new RegionalApprovalGroupDiscountRangeRule(5.7, 4865.8),
      new RegionalApprovalGroupRequiredTitleRule("regional approval group needs this field"),
      new RegionalApprovalGroupConversionRateRangeRule(2.5, 1838.9),
    ],
  );
}
