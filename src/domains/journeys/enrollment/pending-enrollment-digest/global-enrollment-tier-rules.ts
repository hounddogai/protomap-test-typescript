import * as text from "../../../../kit/text.js";
import { GlobalEnrollmentTier } from "./global-enrollment-tier.js";

/** A rule a global enrollment tier must pass. Check returns its problems, or none. */
export interface GlobalEnrollmentTierRule {
  check(item: GlobalEnrollmentTier): string[];
}

export class GlobalEnrollmentTierAllowedSummaryRule implements GlobalEnrollmentTierRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: GlobalEnrollmentTier): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.summary))) return [`summary ${item.summary} is duplicated`];
    return [];
  }
}

export class GlobalEnrollmentTierSourceLengthRule implements GlobalEnrollmentTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalEnrollmentTier): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalEnrollmentTierMarginRangeRule implements GlobalEnrollmentTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalEnrollmentTier): string[] {
    const value = item.margin;
    if (value < this.min || value > this.max) return [`margin ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class GlobalEnrollmentTierRequiredSourceRule implements GlobalEnrollmentTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalEnrollmentTier): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a global enrollment tier. */
export class GlobalEnrollmentTierValidator {
  rules: GlobalEnrollmentTierRule[];

  constructor(rules: GlobalEnrollmentTierRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalEnrollmentTier): string[] {
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

  requireValid(item: GlobalEnrollmentTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalEnrollmentTier[]): Map<string, string[]> {
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

export function defaultGlobalEnrollmentTierValidator(): GlobalEnrollmentTierValidator {
  return new GlobalEnrollmentTierValidator(
    [
      new GlobalEnrollmentTierAllowedSummaryRule(["pending", "adaptive"]),
      new GlobalEnrollmentTierSourceLengthRule(80),
      new GlobalEnrollmentTierMarginRangeRule(1.2, 3791.4),
      new GlobalEnrollmentTierRequiredSourceRule("global enrollment tier needs this field"),
    ],
  );
}
