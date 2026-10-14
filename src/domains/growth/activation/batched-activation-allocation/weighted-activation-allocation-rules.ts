import { WeightedActivationAllocation } from "./weighted-activation-allocation.js";

/** A rule a weighted activation allocation must pass. Check returns its problems, or none. */
export interface WeightedActivationAllocationRule {
  check(item: WeightedActivationAllocation): string[];
}

export class WeightedActivationAllocationConversionRateRangeRule implements WeightedActivationAllocationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedActivationAllocation): string[] {
    const value = item.conversionRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`conversion rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`conversion rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WeightedActivationAllocationRequiredCampaignRefRule implements WeightedActivationAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedActivationAllocation): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedActivationAllocationImpressionsRangeRule implements WeightedActivationAllocationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedActivationAllocation): string[] {
    const value = item.impressions;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`impressions ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`impressions ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WeightedActivationAllocationRequiredNameRule implements WeightedActivationAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedActivationAllocation): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedActivationAllocationCodePrefixRule implements WeightedActivationAllocationRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WeightedActivationAllocation): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a weighted activation allocation. */
export class WeightedActivationAllocationValidator {
  rules: WeightedActivationAllocationRule[];

  constructor(rules: WeightedActivationAllocationRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedActivationAllocation): string[] {
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

  requireValid(item: WeightedActivationAllocation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedActivationAllocation[]): Map<string, string[]> {
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

export function defaultWeightedActivationAllocationValidator(): WeightedActivationAllocationValidator {
  return new WeightedActivationAllocationValidator(
    [
      new WeightedActivationAllocationConversionRateRangeRule(8.1, 3315.9),
      new WeightedActivationAllocationRequiredCampaignRefRule("weighted activation allocation needs a value"),
      new WeightedActivationAllocationImpressionsRangeRule(64, 64),
      new WeightedActivationAllocationRequiredNameRule("weighted activation allocation needs this field"),
      new WeightedActivationAllocationCodePrefixRule("ACM"),
    ],
  );
}
