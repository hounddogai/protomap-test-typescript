import { RedemptionAllocation } from "./redemption-allocation.js";

/** A rule a redemption allocation must pass. Check returns its problems, or none. */
export interface RedemptionAllocationRule {
  check(item: RedemptionAllocation): string[];
}

export class RedemptionAllocationTitleLengthRule implements RedemptionAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RedemptionAllocation): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RedemptionAllocationCategoryLengthRule implements RedemptionAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RedemptionAllocation): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RedemptionAllocationRequiredTitleRule implements RedemptionAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RedemptionAllocation): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class RedemptionAllocationRatioRangeRule implements RedemptionAllocationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RedemptionAllocation): string[] {
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

/** Runs every rule of a redemption allocation. */
export class RedemptionAllocationValidator {
  rules: RedemptionAllocationRule[];

  constructor(rules: RedemptionAllocationRule[]) {
    this.rules = rules;
  }

  validate(item: RedemptionAllocation): string[] {
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

  requireValid(item: RedemptionAllocation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RedemptionAllocation[]): Map<string, string[]> {
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

export function defaultRedemptionAllocationValidator(): RedemptionAllocationValidator {
  return new RedemptionAllocationValidator(
    [
      new RedemptionAllocationTitleLengthRule(86400),
      new RedemptionAllocationCategoryLengthRule(1000),
      new RedemptionAllocationRequiredTitleRule("redemption allocation needs this field"),
      new RedemptionAllocationRatioRangeRule(0.9, 876.8),
    ],
  );
}
