import * as text from "../../../../kit/text.js";
import { RegionalSubscriptionAllocation } from "./regional-subscription-allocation.js";

/** A rule a regional subscription allocation must pass. Check returns its problems, or none. */
export interface RegionalSubscriptionAllocationRule {
  check(item: RegionalSubscriptionAllocation): string[];
}

export class RegionalSubscriptionAllocationRequiredVariantRule implements RegionalSubscriptionAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalSubscriptionAllocation): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalSubscriptionAllocationRequiredCodeRule implements RegionalSubscriptionAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalSubscriptionAllocation): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalSubscriptionAllocationAllowedLabelRule implements RegionalSubscriptionAllocationRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RegionalSubscriptionAllocation): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is above maximum`];
    return [];
  }
}

export class RegionalSubscriptionAllocationRateRangeRule implements RegionalSubscriptionAllocationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalSubscriptionAllocation): string[] {
    const value = item.rate;
    if (value < this.min || value > this.max) return [`rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a regional subscription allocation. */
export class RegionalSubscriptionAllocationValidator {
  rules: RegionalSubscriptionAllocationRule[];

  constructor(rules: RegionalSubscriptionAllocationRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalSubscriptionAllocation): string[] {
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

  requireValid(item: RegionalSubscriptionAllocation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalSubscriptionAllocation[]): Map<string, string[]> {
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

export function defaultRegionalSubscriptionAllocationValidator(): RegionalSubscriptionAllocationValidator {
  return new RegionalSubscriptionAllocationValidator(
    [
      new RegionalSubscriptionAllocationRequiredVariantRule("regional subscription allocation needs a value"),
      new RegionalSubscriptionAllocationRequiredCodeRule("regional subscription allocation needs this field"),
      new RegionalSubscriptionAllocationAllowedLabelRule(["regional"]),
      new RegionalSubscriptionAllocationRateRangeRule(0.5, 2328.1),
    ],
  );
}
