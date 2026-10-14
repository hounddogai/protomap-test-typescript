import { WeightedWarmupMapping } from "./weighted-warmup-mapping.js";

/** A rule a weighted warmup mapping must pass. Check returns its problems, or none. */
export interface WeightedWarmupMappingRule {
  check(item: WeightedWarmupMapping): string[];
}

export class WeightedWarmupMappingAttemptsRangeRule implements WeightedWarmupMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedWarmupMapping): string[] {
    const value = item.attempts;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`attempts ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`attempts ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WeightedWarmupMappingExternalRefLengthRule implements WeightedWarmupMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedWarmupMapping): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedWarmupMappingCodePrefixRule implements WeightedWarmupMappingRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WeightedWarmupMapping): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a weighted warmup mapping. */
export class WeightedWarmupMappingValidator {
  rules: WeightedWarmupMappingRule[];

  constructor(rules: WeightedWarmupMappingRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedWarmupMapping): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedWarmupMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedWarmupMapping[]): Map<string, string[]> {
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

export function defaultWeightedWarmupMappingValidator(): WeightedWarmupMappingValidator {
  return new WeightedWarmupMappingValidator(
    [
      new WeightedWarmupMappingAttemptsRangeRule(255, 1000),
      new WeightedWarmupMappingExternalRefLengthRule(32),
      new WeightedWarmupMappingCodePrefixRule("REF"),
    ],
  );
}
