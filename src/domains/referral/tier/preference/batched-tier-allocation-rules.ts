import * as text from "../../../../kit/text.js";
import { BatchedTierAllocation } from "./batched-tier-allocation.js";

/** A rule a batched tier allocation must pass. Check returns its problems, or none. */
export interface BatchedTierAllocationRule {
  check(item: BatchedTierAllocation): string[];
}

export class BatchedTierAllocationRequiredCountryRule implements BatchedTierAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedTierAllocation): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedTierAllocationNameLengthRule implements BatchedTierAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedTierAllocation): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedTierAllocationRequiredCurrencyRule implements BatchedTierAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedTierAllocation): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedTierAllocationAllowedCurrencyRule implements BatchedTierAllocationRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BatchedTierAllocation): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.currency))) return [`currency ${item.currency} is below minimum`];
    return [];
  }
}

export class BatchedTierAllocationCountryLengthRule implements BatchedTierAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedTierAllocation): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedTierAllocationRequiredNameRule implements BatchedTierAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedTierAllocation): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a batched tier allocation. */
export class BatchedTierAllocationValidator {
  rules: BatchedTierAllocationRule[];

  constructor(rules: BatchedTierAllocationRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedTierAllocation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedTierAllocation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedTierAllocation[]): Map<string, string[]> {
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

export function defaultBatchedTierAllocationValidator(): BatchedTierAllocationValidator {
  return new BatchedTierAllocationValidator(
    [
      new BatchedTierAllocationRequiredCountryRule("batched tier allocation needs a value"),
      new BatchedTierAllocationNameLengthRule(3600),
      new BatchedTierAllocationRequiredCurrencyRule("batched tier allocation needs this field"),
      new BatchedTierAllocationAllowedCurrencyRule(["seasonal"]),
      new BatchedTierAllocationCountryLengthRule(32),
      new BatchedTierAllocationRequiredNameRule("batched tier allocation needs a value"),
    ],
  );
}
