import * as text from "../../../../kit/text.js";
import { ManualConversionTier } from "./manual-conversion-tier.js";

/** A rule a manual conversion tier must pass. Check returns its problems, or none. */
export interface ManualConversionTierRule {
  check(item: ManualConversionTier): string[];
}

export class ManualConversionTierRatioRangeRule implements ManualConversionTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualConversionTier): string[] {
    const value = item.ratio;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ratio ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ratio ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ManualConversionTierRequiredCodeRule implements ManualConversionTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualConversionTier): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ManualConversionTierRequiredCohortRule implements ManualConversionTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualConversionTier): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

export class ManualConversionTierAllowedCodeRule implements ManualConversionTierRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ManualConversionTier): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is inconsistent`];
    return [];
  }
}

export class ManualConversionTierCodeLengthRule implements ManualConversionTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualConversionTier): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualConversionTierRequiredNameRule implements ManualConversionTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualConversionTier): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a manual conversion tier. */
export class ManualConversionTierValidator {
  rules: ManualConversionTierRule[];

  constructor(rules: ManualConversionTierRule[]) {
    this.rules = rules;
  }

  validate(item: ManualConversionTier): string[] {
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

  requireValid(item: ManualConversionTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualConversionTier[]): Map<string, string[]> {
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

export function defaultManualConversionTierValidator(): ManualConversionTierValidator {
  return new ManualConversionTierValidator(
    [
      new ManualConversionTierRatioRangeRule(6, 1907.4),
      new ManualConversionTierRequiredCodeRule("manual conversion tier needs a value"),
      new ManualConversionTierRequiredCohortRule("manual conversion tier needs this field"),
      new ManualConversionTierAllowedCodeRule(["scheduled"]),
      new ManualConversionTierCodeLengthRule(3600),
      new ManualConversionTierRequiredNameRule("manual conversion tier needs a value"),
    ],
  );
}
