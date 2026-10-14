import { BranchEstimate } from "./branch-estimate.js";

/** A rule a branch estimate must pass. Check returns its problems, or none. */
export interface BranchEstimateRule {
  check(item: BranchEstimate): string[];
}

export class BranchEstimateRatioRangeRule implements BranchEstimateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BranchEstimate): string[] {
    const value = item.ratio;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ratio ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ratio ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BranchEstimateCodeLengthRule implements BranchEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BranchEstimate): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BranchEstimateCodePrefixRule implements BranchEstimateRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BranchEstimate): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a branch estimate. */
export class BranchEstimateValidator {
  rules: BranchEstimateRule[];

  constructor(rules: BranchEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: BranchEstimate): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BranchEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BranchEstimate[]): Map<string, string[]> {
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

export function defaultBranchEstimateValidator(): BranchEstimateValidator {
  return new BranchEstimateValidator(
    [
      new BranchEstimateRatioRangeRule(2.3, 4526.6),
      new BranchEstimateCodeLengthRule(16),
      new BranchEstimateCodePrefixRule("X"),
    ],
  );
}
