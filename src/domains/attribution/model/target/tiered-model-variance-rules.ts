import * as text from "../../../../kit/text.js";
import { TieredModelVariance } from "./tiered-model-variance.js";

/** A rule a tiered model variance must pass. Check returns its problems, or none. */
export interface TieredModelVarianceRule {
  check(item: TieredModelVariance): string[];
}

export class TieredModelVarianceRequiredCodeRule implements TieredModelVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredModelVariance): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TieredModelVarianceAllowedTitleRule implements TieredModelVarianceRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TieredModelVariance): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is above maximum`];
    return [];
  }
}

export class TieredModelVarianceTitleLengthRule implements TieredModelVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredModelVariance): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredModelVarianceRequiredTitleRule implements TieredModelVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredModelVariance): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class TieredModelVarianceRateRangeRule implements TieredModelVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredModelVariance): string[] {
    const value = item.rate;
    if (value < this.min || value > this.max) return [`rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredModelVarianceAttemptsRangeRule implements TieredModelVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredModelVariance): string[] {
    const value = item.attempts;
    if (value < this.min || value > this.max) return [`attempts ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a tiered model variance. */
export class TieredModelVarianceValidator {
  rules: TieredModelVarianceRule[];

  constructor(rules: TieredModelVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: TieredModelVariance): string[] {
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

  requireValid(item: TieredModelVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredModelVariance[]): Map<string, string[]> {
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

export function defaultTieredModelVarianceValidator(): TieredModelVarianceValidator {
  return new TieredModelVarianceValidator(
    [
      new TieredModelVarianceRequiredCodeRule("tiered model variance needs a value"),
      new TieredModelVarianceAllowedTitleRule(["weighted"]),
      new TieredModelVarianceTitleLengthRule(86400),
      new TieredModelVarianceRequiredTitleRule("tiered model variance needs this field"),
      new TieredModelVarianceRateRangeRule(8.8, 743),
      new TieredModelVarianceAttemptsRangeRule(80, 3600),
    ],
  );
}
