import * as text from "../../../../kit/text.js";
import { SeasonalBranchBundle } from "./seasonal-branch-bundle.js";

/** A rule a seasonal branch bundle must pass. Check returns its problems, or none. */
export interface SeasonalBranchBundleRule {
  check(item: SeasonalBranchBundle): string[];
}

export class SeasonalBranchBundleRateRangeRule implements SeasonalBranchBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalBranchBundle): string[] {
    const value = item.rate;
    if (value < this.min || value > this.max) return [`rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SeasonalBranchBundleAllowedLabelRule implements SeasonalBranchBundleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SeasonalBranchBundle): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is blocked`];
    return [];
  }
}

export class SeasonalBranchBundleCodePrefixRule implements SeasonalBranchBundleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SeasonalBranchBundle): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SeasonalBranchBundleRequiredCodeRule implements SeasonalBranchBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalBranchBundle): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalBranchBundleCodeLengthRule implements SeasonalBranchBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalBranchBundle): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalBranchBundleConversionRateRangeRule implements SeasonalBranchBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalBranchBundle): string[] {
    const value = item.conversionRate;
    if (value < this.min || value > this.max) return [`conversion rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a seasonal branch bundle. */
export class SeasonalBranchBundleValidator {
  rules: SeasonalBranchBundleRule[];

  constructor(rules: SeasonalBranchBundleRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalBranchBundle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SeasonalBranchBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalBranchBundle[]): Map<string, string[]> {
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

export function defaultSeasonalBranchBundleValidator(): SeasonalBranchBundleValidator {
  return new SeasonalBranchBundleValidator(
    [
      new SeasonalBranchBundleRateRangeRule(7.2, 1655.4),
      new SeasonalBranchBundleAllowedLabelRule(["batched"]),
      new SeasonalBranchBundleCodePrefixRule("X"),
      new SeasonalBranchBundleRequiredCodeRule("seasonal branch bundle needs this field"),
      new SeasonalBranchBundleCodeLengthRule(255),
      new SeasonalBranchBundleConversionRateRangeRule(4.1, 3541),
    ],
  );
}
