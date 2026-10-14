import * as text from "../../../../kit/text.js";
import { WeightedReputationAdjustment } from "./weighted-reputation-adjustment.js";

/** A rule a weighted reputation adjustment must pass. Check returns its problems, or none. */
export interface WeightedReputationAdjustmentRule {
  check(item: WeightedReputationAdjustment): string[];
}

export class WeightedReputationAdjustmentQuantityRangeRule implements WeightedReputationAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedReputationAdjustment): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WeightedReputationAdjustmentCodePrefixRule implements WeightedReputationAdjustmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WeightedReputationAdjustment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WeightedReputationAdjustmentRequiredCodeRule implements WeightedReputationAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedReputationAdjustment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedReputationAdjustmentRequiredCurrencyRule implements WeightedReputationAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedReputationAdjustment): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedReputationAdjustmentMarginRangeRule implements WeightedReputationAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedReputationAdjustment): string[] {
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

export class WeightedReputationAdjustmentAllowedCodeRule implements WeightedReputationAdjustmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WeightedReputationAdjustment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is missing`];
    return [];
  }
}

/** Runs every rule of a weighted reputation adjustment. */
export class WeightedReputationAdjustmentValidator {
  rules: WeightedReputationAdjustmentRule[];

  constructor(rules: WeightedReputationAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedReputationAdjustment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedReputationAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedReputationAdjustment[]): Map<string, string[]> {
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

export function defaultWeightedReputationAdjustmentValidator(): WeightedReputationAdjustmentValidator {
  return new WeightedReputationAdjustmentValidator(
    [
      new WeightedReputationAdjustmentQuantityRangeRule(16, 255),
      new WeightedReputationAdjustmentCodePrefixRule("OPS"),
      new WeightedReputationAdjustmentRequiredCodeRule("weighted reputation adjustment needs an entry"),
      new WeightedReputationAdjustmentRequiredCurrencyRule("weighted reputation adjustment needs an entry"),
      new WeightedReputationAdjustmentMarginRangeRule(5.3, 1213.5),
      new WeightedReputationAdjustmentAllowedCodeRule(["primary", "lenient"]),
    ],
  );
}
