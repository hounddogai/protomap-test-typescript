import * as text from "../../../../kit/text.js";
import { TieredBounceAllocation } from "./tiered-bounce-allocation.js";

/** A rule a tiered bounce allocation must pass. Check returns its problems, or none. */
export interface TieredBounceAllocationRule {
  check(item: TieredBounceAllocation): string[];
}

export class TieredBounceAllocationRetriesRangeRule implements TieredBounceAllocationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredBounceAllocation): string[] {
    const value = item.retries;
    if (value < this.min || value > this.max) return [`retries ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredBounceAllocationCampaignRefLengthRule implements TieredBounceAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredBounceAllocation): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredBounceAllocationAllowedCampaignRefRule implements TieredBounceAllocationRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TieredBounceAllocation): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.campaignRef))) return [`campaign ref ${item.campaignRef} is above maximum`];
    return [];
  }
}

/** Runs every rule of a tiered bounce allocation. */
export class TieredBounceAllocationValidator {
  rules: TieredBounceAllocationRule[];

  constructor(rules: TieredBounceAllocationRule[]) {
    this.rules = rules;
  }

  validate(item: TieredBounceAllocation): string[] {
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

  requireValid(item: TieredBounceAllocation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredBounceAllocation[]): Map<string, string[]> {
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

export function defaultTieredBounceAllocationValidator(): TieredBounceAllocationValidator {
  return new TieredBounceAllocationValidator(
    [
      new TieredBounceAllocationRetriesRangeRule(64, 64),
      new TieredBounceAllocationCampaignRefLengthRule(64),
      new TieredBounceAllocationAllowedCampaignRefRule(["manual", "batched"]),
    ],
  );
}
