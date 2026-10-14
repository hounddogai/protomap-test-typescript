import * as text from "../../../../kit/text.js";
import { WeightedPayoutAllocation } from "./weighted-payout-allocation.js";

/** A rule a weighted payout allocation must pass. Check returns its problems, or none. */
export interface WeightedPayoutAllocationRule {
  check(item: WeightedPayoutAllocation): string[];
}

export class WeightedPayoutAllocationAllowedCodeRule implements WeightedPayoutAllocationRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WeightedPayoutAllocation): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is stale`];
    return [];
  }
}

export class WeightedPayoutAllocationCapacityRangeRule implements WeightedPayoutAllocationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedPayoutAllocation): string[] {
    const value = item.capacity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`capacity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`capacity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WeightedPayoutAllocationGraceDaysRangeRule implements WeightedPayoutAllocationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedPayoutAllocation): string[] {
    const value = item.graceDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`grace days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`grace days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WeightedPayoutAllocationBidRangeRule implements WeightedPayoutAllocationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedPayoutAllocation): string[] {
    const value = item.bid;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`bid ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`bid ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WeightedPayoutAllocationExternalRefLengthRule implements WeightedPayoutAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedPayoutAllocation): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedPayoutAllocationRateRangeRule implements WeightedPayoutAllocationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedPayoutAllocation): string[] {
    const value = item.rate;
    if (value < this.min || value > this.max) return [`rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a weighted payout allocation. */
export class WeightedPayoutAllocationValidator {
  rules: WeightedPayoutAllocationRule[];

  constructor(rules: WeightedPayoutAllocationRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedPayoutAllocation): string[] {
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

  requireValid(item: WeightedPayoutAllocation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedPayoutAllocation[]): Map<string, string[]> {
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

export function defaultWeightedPayoutAllocationValidator(): WeightedPayoutAllocationValidator {
  return new WeightedPayoutAllocationValidator(
    [
      new WeightedPayoutAllocationAllowedCodeRule([]),
      new WeightedPayoutAllocationCapacityRangeRule(120, 86400),
      new WeightedPayoutAllocationGraceDaysRangeRule(1000, 86400),
      new WeightedPayoutAllocationBidRangeRule(9.9, 3188.1),
      new WeightedPayoutAllocationExternalRefLengthRule(64),
      new WeightedPayoutAllocationRateRangeRule(6.9, 2386.1),
    ],
  );
}
