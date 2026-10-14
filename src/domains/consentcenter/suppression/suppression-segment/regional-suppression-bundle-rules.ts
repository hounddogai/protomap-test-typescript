import * as text from "../../../../kit/text.js";
import { RegionalSuppressionBundle } from "./regional-suppression-bundle.js";

/** A rule a regional suppression bundle must pass. Check returns its problems, or none. */
export interface RegionalSuppressionBundleRule {
  check(item: RegionalSuppressionBundle): string[];
}

export class RegionalSuppressionBundleWeightRangeRule implements RegionalSuppressionBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalSuppressionBundle): string[] {
    const value = item.weight;
    if (value < this.min || value > this.max) return [`weight ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RegionalSuppressionBundleCodeLengthRule implements RegionalSuppressionBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalSuppressionBundle): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalSuppressionBundleCostRangeRule implements RegionalSuppressionBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalSuppressionBundle): string[] {
    const value = item.cost;
    if (value < this.min || value > this.max) return [`cost ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RegionalSuppressionBundleAllowedCodeRule implements RegionalSuppressionBundleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RegionalSuppressionBundle): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is blocked`];
    return [];
  }
}

export class RegionalSuppressionBundleRequiredTitleRule implements RegionalSuppressionBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalSuppressionBundle): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalSuppressionBundleSummaryLengthRule implements RegionalSuppressionBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalSuppressionBundle): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a regional suppression bundle. */
export class RegionalSuppressionBundleValidator {
  rules: RegionalSuppressionBundleRule[];

  constructor(rules: RegionalSuppressionBundleRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalSuppressionBundle): string[] {
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

  requireValid(item: RegionalSuppressionBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalSuppressionBundle[]): Map<string, string[]> {
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

export function defaultRegionalSuppressionBundleValidator(): RegionalSuppressionBundleValidator {
  return new RegionalSuppressionBundleValidator(
    [
      new RegionalSuppressionBundleWeightRangeRule(0.8, 1419.9),
      new RegionalSuppressionBundleCodeLengthRule(80),
      new RegionalSuppressionBundleCostRangeRule(8.9, 2432.3),
      new RegionalSuppressionBundleAllowedCodeRule(["capped", "tiered", "lenient"]),
      new RegionalSuppressionBundleRequiredTitleRule("regional suppression bundle needs an entry"),
      new RegionalSuppressionBundleSummaryLengthRule(120),
    ],
  );
}
