import * as text from "../../../../kit/text.js";
import { WeightedEscalationAdjustment } from "./weighted-escalation-adjustment.js";

/** A rule a weighted escalation adjustment must pass. Check returns its problems, or none. */
export interface WeightedEscalationAdjustmentRule {
  check(item: WeightedEscalationAdjustment): string[];
}

export class WeightedEscalationAdjustmentLocaleLengthRule implements WeightedEscalationAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedEscalationAdjustment): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedEscalationAdjustmentWeightRangeRule implements WeightedEscalationAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedEscalationAdjustment): string[] {
    const value = item.weight;
    if (value < this.min || value > this.max) return [`weight ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WeightedEscalationAdjustmentAllowedLocaleRule implements WeightedEscalationAdjustmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WeightedEscalationAdjustment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.locale))) return [`locale ${item.locale} is out of range`];
    return [];
  }
}

/** Runs every rule of a weighted escalation adjustment. */
export class WeightedEscalationAdjustmentValidator {
  rules: WeightedEscalationAdjustmentRule[];

  constructor(rules: WeightedEscalationAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedEscalationAdjustment): string[] {
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

  requireValid(item: WeightedEscalationAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedEscalationAdjustment[]): Map<string, string[]> {
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

export function defaultWeightedEscalationAdjustmentValidator(): WeightedEscalationAdjustmentValidator {
  return new WeightedEscalationAdjustmentValidator(
    [
      new WeightedEscalationAdjustmentLocaleLengthRule(1000),
      new WeightedEscalationAdjustmentWeightRangeRule(1.9, 2784.4),
      new WeightedEscalationAdjustmentAllowedLocaleRule(["manual", "legacy"]),
    ],
  );
}
