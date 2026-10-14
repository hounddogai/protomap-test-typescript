import { WeightedRetentionAllocation } from "./weighted-retention-allocation.js";

/** A rule a weighted retention allocation must pass. Check returns its problems, or none. */
export interface WeightedRetentionAllocationRule {
  check(item: WeightedRetentionAllocation): string[];
}

export class WeightedRetentionAllocationTitleLengthRule implements WeightedRetentionAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedRetentionAllocation): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedRetentionAllocationCodePrefixRule implements WeightedRetentionAllocationRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WeightedRetentionAllocation): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WeightedRetentionAllocationChecksumLengthRule implements WeightedRetentionAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedRetentionAllocation): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a weighted retention allocation. */
export class WeightedRetentionAllocationValidator {
  rules: WeightedRetentionAllocationRule[];

  constructor(rules: WeightedRetentionAllocationRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedRetentionAllocation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedRetentionAllocation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedRetentionAllocation[]): Map<string, string[]> {
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

export function defaultWeightedRetentionAllocationValidator(): WeightedRetentionAllocationValidator {
  return new WeightedRetentionAllocationValidator(
    [
      new WeightedRetentionAllocationTitleLengthRule(255),
      new WeightedRetentionAllocationCodePrefixRule("X"),
      new WeightedRetentionAllocationChecksumLengthRule(16),
    ],
  );
}
