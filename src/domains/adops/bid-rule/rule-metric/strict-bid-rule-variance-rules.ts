import * as text from "../../../../kit/text.js";
import { StrictBidRuleVariance } from "./strict-bid-rule-variance.js";

/** A rule a strict bid rule variance must pass. Check returns its problems, or none. */
export interface StrictBidRuleVarianceRule {
  check(item: StrictBidRuleVariance): string[];
}

export class StrictBidRuleVarianceCeilingRangeRule implements StrictBidRuleVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictBidRuleVariance): string[] {
    const value = item.ceiling;
    if (value < this.min || value > this.max) return [`ceiling ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StrictBidRuleVarianceAllowedUnitRule implements StrictBidRuleVarianceRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StrictBidRuleVariance): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.unit))) return [`unit ${item.unit} is out of range`];
    return [];
  }
}

export class StrictBidRuleVarianceMarginRangeRule implements StrictBidRuleVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictBidRuleVariance): string[] {
    const value = item.margin;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`margin ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`margin ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StrictBidRuleVarianceUpdatedAtRangeRule implements StrictBidRuleVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictBidRuleVariance): string[] {
    const value = item.updatedAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`updated at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`updated at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StrictBidRuleVarianceLabelLengthRule implements StrictBidRuleVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictBidRuleVariance): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a strict bid rule variance. */
export class StrictBidRuleVarianceValidator {
  rules: StrictBidRuleVarianceRule[];

  constructor(rules: StrictBidRuleVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: StrictBidRuleVariance): string[] {
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

  requireValid(item: StrictBidRuleVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictBidRuleVariance[]): Map<string, string[]> {
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

export function defaultStrictBidRuleVarianceValidator(): StrictBidRuleVarianceValidator {
  return new StrictBidRuleVarianceValidator(
    [
      new StrictBidRuleVarianceCeilingRangeRule(9.1, 523.4),
      new StrictBidRuleVarianceAllowedUnitRule(["tiered"]),
      new StrictBidRuleVarianceMarginRangeRule(1.3, 2569.5),
      new StrictBidRuleVarianceUpdatedAtRangeRule(32, 255),
      new StrictBidRuleVarianceLabelLengthRule(16),
    ],
  );
}
