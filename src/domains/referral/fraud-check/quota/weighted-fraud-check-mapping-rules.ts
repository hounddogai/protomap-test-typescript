import { WeightedFraudCheckMapping } from "./weighted-fraud-check-mapping.js";

/** A rule a weighted fraud check mapping must pass. Check returns its problems, or none. */
export interface WeightedFraudCheckMappingRule {
  check(item: WeightedFraudCheckMapping): string[];
}

export class WeightedFraudCheckMappingMarginRangeRule implements WeightedFraudCheckMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedFraudCheckMapping): string[] {
    const value = item.margin;
    if (value < this.min || value > this.max) return [`margin ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WeightedFraudCheckMappingCodePrefixRule implements WeightedFraudCheckMappingRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WeightedFraudCheckMapping): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WeightedFraudCheckMappingRequiredUtmSourceRule implements WeightedFraudCheckMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedFraudCheckMapping): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a weighted fraud check mapping. */
export class WeightedFraudCheckMappingValidator {
  rules: WeightedFraudCheckMappingRule[];

  constructor(rules: WeightedFraudCheckMappingRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedFraudCheckMapping): string[] {
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

  requireValid(item: WeightedFraudCheckMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedFraudCheckMapping[]): Map<string, string[]> {
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

export function defaultWeightedFraudCheckMappingValidator(): WeightedFraudCheckMappingValidator {
  return new WeightedFraudCheckMappingValidator(
    [
      new WeightedFraudCheckMappingMarginRangeRule(3, 4863),
      new WeightedFraudCheckMappingCodePrefixRule("ACM"),
      new WeightedFraudCheckMappingRequiredUtmSourceRule("weighted fraud check mapping needs this field"),
    ],
  );
}
