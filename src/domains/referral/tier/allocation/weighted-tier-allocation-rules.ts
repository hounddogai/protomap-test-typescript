import * as text from "../../../../kit/text.js";
import { WeightedTierAllocation } from "./weighted-tier-allocation.js";

/** A rule a weighted tier allocation must pass. Check returns its problems, or none. */
export interface WeightedTierAllocationRule {
  check(item: WeightedTierAllocation): string[];
}

export class WeightedTierAllocationUpdatedAtRangeRule implements WeightedTierAllocationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedTierAllocation): string[] {
    const value = item.updatedAt;
    if (value < this.min || value > this.max) return [`updated at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WeightedTierAllocationRequiredLabelRule implements WeightedTierAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedTierAllocation): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedTierAllocationAllowedLabelRule implements WeightedTierAllocationRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WeightedTierAllocation): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is expired`];
    return [];
  }
}

export class WeightedTierAllocationLabelLengthRule implements WeightedTierAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedTierAllocation): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedTierAllocationSendAtRangeRule implements WeightedTierAllocationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedTierAllocation): string[] {
    const value = item.sendAt;
    if (value < this.min || value > this.max) return [`send at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a weighted tier allocation. */
export class WeightedTierAllocationValidator {
  rules: WeightedTierAllocationRule[];

  constructor(rules: WeightedTierAllocationRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedTierAllocation): string[] {
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

  requireValid(item: WeightedTierAllocation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedTierAllocation[]): Map<string, string[]> {
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

export function defaultWeightedTierAllocationValidator(): WeightedTierAllocationValidator {
  return new WeightedTierAllocationValidator(
    [
      new WeightedTierAllocationUpdatedAtRangeRule(16, 64),
      new WeightedTierAllocationRequiredLabelRule("weighted tier allocation needs a value"),
      new WeightedTierAllocationAllowedLabelRule(["scheduled"]),
      new WeightedTierAllocationLabelLengthRule(64),
      new WeightedTierAllocationSendAtRangeRule(32, 80),
    ],
  );
}
