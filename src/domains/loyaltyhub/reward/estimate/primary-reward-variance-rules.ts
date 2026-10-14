import * as text from "../../../../kit/text.js";
import { PrimaryRewardVariance } from "./primary-reward-variance.js";

/** A rule a primary reward variance must pass. Check returns its problems, or none. */
export interface PrimaryRewardVarianceRule {
  check(item: PrimaryRewardVariance): string[];
}

export class PrimaryRewardVarianceRequiredCodeRule implements PrimaryRewardVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryRewardVariance): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryRewardVarianceAllowedNameRule implements PrimaryRewardVarianceRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PrimaryRewardVariance): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is missing`];
    return [];
  }
}

export class PrimaryRewardVarianceRetriesRangeRule implements PrimaryRewardVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryRewardVariance): string[] {
    const value = item.retries;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`retries ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`retries ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PrimaryRewardVarianceRequiredLabelRule implements PrimaryRewardVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryRewardVariance): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryRewardVarianceCodeLengthRule implements PrimaryRewardVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryRewardVariance): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryRewardVarianceLabelLengthRule implements PrimaryRewardVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryRewardVariance): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a primary reward variance. */
export class PrimaryRewardVarianceValidator {
  rules: PrimaryRewardVarianceRule[];

  constructor(rules: PrimaryRewardVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryRewardVariance): string[] {
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

  requireValid(item: PrimaryRewardVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryRewardVariance[]): Map<string, string[]> {
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

export function defaultPrimaryRewardVarianceValidator(): PrimaryRewardVarianceValidator {
  return new PrimaryRewardVarianceValidator(
    [
      new PrimaryRewardVarianceRequiredCodeRule("primary reward variance needs a value"),
      new PrimaryRewardVarianceAllowedNameRule(["tiered", "capped", "pending"]),
      new PrimaryRewardVarianceRetriesRangeRule(3600, 86400),
      new PrimaryRewardVarianceRequiredLabelRule("primary reward variance needs an entry"),
      new PrimaryRewardVarianceCodeLengthRule(16),
      new PrimaryRewardVarianceLabelLengthRule(255),
    ],
  );
}
