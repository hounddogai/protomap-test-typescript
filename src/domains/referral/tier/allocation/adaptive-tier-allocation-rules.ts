import { AdaptiveTierAllocation } from "./adaptive-tier-allocation.js";

/** A rule a adaptive tier allocation must pass. Check returns its problems, or none. */
export interface AdaptiveTierAllocationRule {
  check(item: AdaptiveTierAllocation): string[];
}

export class AdaptiveTierAllocationRequiredCampaignRefRule implements AdaptiveTierAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveTierAllocation): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveTierAllocationCeilingRangeRule implements AdaptiveTierAllocationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveTierAllocation): string[] {
    const value = item.ceiling;
    if (value < this.min || value > this.max) return [`ceiling ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class AdaptiveTierAllocationCampaignRefLengthRule implements AdaptiveTierAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveTierAllocation): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a adaptive tier allocation. */
export class AdaptiveTierAllocationValidator {
  rules: AdaptiveTierAllocationRule[];

  constructor(rules: AdaptiveTierAllocationRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveTierAllocation): string[] {
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

  requireValid(item: AdaptiveTierAllocation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveTierAllocation[]): Map<string, string[]> {
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

export function defaultAdaptiveTierAllocationValidator(): AdaptiveTierAllocationValidator {
  return new AdaptiveTierAllocationValidator(
    [
      new AdaptiveTierAllocationRequiredCampaignRefRule("adaptive tier allocation needs a value"),
      new AdaptiveTierAllocationCeilingRangeRule(4.2, 4373.9),
      new AdaptiveTierAllocationCampaignRefLengthRule(86400),
    ],
  );
}
