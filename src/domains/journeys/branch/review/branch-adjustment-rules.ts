import { BranchAdjustment } from "./branch-adjustment.js";

/** A rule a branch adjustment must pass. Check returns its problems, or none. */
export interface BranchAdjustmentRule {
  check(item: BranchAdjustment): string[];
}

export class BranchAdjustmentCodePrefixRule implements BranchAdjustmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BranchAdjustment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BranchAdjustmentCodeLengthRule implements BranchAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BranchAdjustment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BranchAdjustmentMarginRangeRule implements BranchAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BranchAdjustment): string[] {
    const value = item.margin;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`margin ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`margin ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BranchAdjustmentRequiredUtmSourceRule implements BranchAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BranchAdjustment): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a branch adjustment. */
export class BranchAdjustmentValidator {
  rules: BranchAdjustmentRule[];

  constructor(rules: BranchAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: BranchAdjustment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BranchAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BranchAdjustment[]): Map<string, string[]> {
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

export function defaultBranchAdjustmentValidator(): BranchAdjustmentValidator {
  return new BranchAdjustmentValidator(
    [
      new BranchAdjustmentCodePrefixRule("ACM"),
      new BranchAdjustmentCodeLengthRule(32),
      new BranchAdjustmentMarginRangeRule(9.5, 3799.4),
      new BranchAdjustmentRequiredUtmSourceRule("branch adjustment needs a value"),
    ],
  );
}
