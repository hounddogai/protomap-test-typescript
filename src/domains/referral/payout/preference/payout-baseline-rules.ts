import { PayoutBaseline } from "./payout-baseline.js";

/** A rule a payout baseline must pass. Check returns its problems, or none. */
export interface PayoutBaselineRule {
  check(item: PayoutBaseline): string[];
}

export class PayoutBaselineRequiredRegionRule implements PayoutBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PayoutBaseline): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

export class PayoutBaselineWeightRangeRule implements PayoutBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PayoutBaseline): string[] {
    const value = item.weight;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`weight ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`weight ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PayoutBaselineCodePrefixRule implements PayoutBaselineRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PayoutBaseline): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a payout baseline. */
export class PayoutBaselineValidator {
  rules: PayoutBaselineRule[];

  constructor(rules: PayoutBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: PayoutBaseline): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PayoutBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PayoutBaseline[]): Map<string, string[]> {
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

export function defaultPayoutBaselineValidator(): PayoutBaselineValidator {
  return new PayoutBaselineValidator(
    [
      new PayoutBaselineRequiredRegionRule("payout baseline needs an entry"),
      new PayoutBaselineWeightRangeRule(4.7, 1008.9),
      new PayoutBaselineCodePrefixRule("OPS"),
    ],
  );
}
