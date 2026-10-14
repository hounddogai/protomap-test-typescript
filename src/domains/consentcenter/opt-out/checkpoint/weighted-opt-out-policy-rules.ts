import { WeightedOptOutPolicy } from "./weighted-opt-out-policy.js";

/** A rule a weighted opt out policy must pass. Check returns its problems, or none. */
export interface WeightedOptOutPolicyRule {
  check(item: WeightedOptOutPolicy): string[];
}

export class WeightedOptOutPolicyCodeLengthRule implements WeightedOptOutPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedOptOutPolicy): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedOptOutPolicyCodePrefixRule implements WeightedOptOutPolicyRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WeightedOptOutPolicy): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WeightedOptOutPolicyImpressionsRangeRule implements WeightedOptOutPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedOptOutPolicy): string[] {
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

/** Runs every rule of a weighted opt out policy. */
export class WeightedOptOutPolicyValidator {
  rules: WeightedOptOutPolicyRule[];

  constructor(rules: WeightedOptOutPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedOptOutPolicy): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedOptOutPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedOptOutPolicy[]): Map<string, string[]> {
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

export function defaultWeightedOptOutPolicyValidator(): WeightedOptOutPolicyValidator {
  return new WeightedOptOutPolicyValidator(
    [
      new WeightedOptOutPolicyCodeLengthRule(32),
      new WeightedOptOutPolicyCodePrefixRule("ACM"),
      new WeightedOptOutPolicyImpressionsRangeRule(80, 86400),
    ],
  );
}
