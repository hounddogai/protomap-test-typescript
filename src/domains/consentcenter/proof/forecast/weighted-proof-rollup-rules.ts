import { WeightedProofRollup } from "./weighted-proof-rollup.js";

/** A rule a weighted proof rollup must pass. Check returns its problems, or none. */
export interface WeightedProofRollupRule {
  check(item: WeightedProofRollup): string[];
}

export class WeightedProofRollupCodeLengthRule implements WeightedProofRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedProofRollup): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedProofRollupRequiredUnitRule implements WeightedProofRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedProofRollup): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedProofRollupCapacityRangeRule implements WeightedProofRollupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedProofRollup): string[] {
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

export class WeightedProofRollupCodePrefixRule implements WeightedProofRollupRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WeightedProofRollup): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a weighted proof rollup. */
export class WeightedProofRollupValidator {
  rules: WeightedProofRollupRule[];

  constructor(rules: WeightedProofRollupRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedProofRollup): string[] {
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

  requireValid(item: WeightedProofRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedProofRollup[]): Map<string, string[]> {
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

export function defaultWeightedProofRollupValidator(): WeightedProofRollupValidator {
  return new WeightedProofRollupValidator(
    [
      new WeightedProofRollupCodeLengthRule(1000),
      new WeightedProofRollupRequiredUnitRule("weighted proof rollup needs an entry"),
      new WeightedProofRollupCapacityRangeRule(64, 1000),
      new WeightedProofRollupCodePrefixRule("REF"),
    ],
  );
}
