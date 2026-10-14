import * as text from "../../../../kit/text.js";
import { ChallengeSummary } from "./challenge-summary.js";

/** A rule a challenge summary must pass. Check returns its problems, or none. */
export interface ChallengeSummaryRule {
  check(item: ChallengeSummary): string[];
}

export class ChallengeSummaryQuantityRangeRule implements ChallengeSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ChallengeSummary): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ChallengeSummaryLimitRangeRule implements ChallengeSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ChallengeSummary): string[] {
    const value = item.limit;
    if (value < this.min || value > this.max) return [`limit ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ChallengeSummaryCodeLengthRule implements ChallengeSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ChallengeSummary): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ChallengeSummaryWeightRangeRule implements ChallengeSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ChallengeSummary): string[] {
    const value = item.weight;
    if (value < this.min || value > this.max) return [`weight ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ChallengeSummaryAllowedCodeRule implements ChallengeSummaryRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ChallengeSummary): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is above maximum`];
    return [];
  }
}

export class ChallengeSummaryMinimumRangeRule implements ChallengeSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ChallengeSummary): string[] {
    const value = item.minimum;
    if (value < this.min || value > this.max) return [`minimum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a challenge summary. */
export class ChallengeSummaryValidator {
  rules: ChallengeSummaryRule[];

  constructor(rules: ChallengeSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: ChallengeSummary): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ChallengeSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ChallengeSummary[]): Map<string, string[]> {
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

export function defaultChallengeSummaryValidator(): ChallengeSummaryValidator {
  return new ChallengeSummaryValidator(
    [
      new ChallengeSummaryQuantityRangeRule(64, 120),
      new ChallengeSummaryLimitRangeRule(255, 3600),
      new ChallengeSummaryCodeLengthRule(86400),
      new ChallengeSummaryWeightRangeRule(6.5, 2156),
      new ChallengeSummaryAllowedCodeRule(["default"]),
      new ChallengeSummaryMinimumRangeRule(6.6, 1143.6),
    ],
  );
}
