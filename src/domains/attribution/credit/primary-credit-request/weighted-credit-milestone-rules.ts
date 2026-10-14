import { WeightedCreditMilestone } from "./weighted-credit-milestone.js";

/** A rule a weighted credit milestone must pass. Check returns its problems, or none. */
export interface WeightedCreditMilestoneRule {
  check(item: WeightedCreditMilestone): string[];
}

export class WeightedCreditMilestoneCodeLengthRule implements WeightedCreditMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedCreditMilestone): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedCreditMilestoneRequiredOwnerIdRule implements WeightedCreditMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedCreditMilestone): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedCreditMilestoneLimitRangeRule implements WeightedCreditMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedCreditMilestone): string[] {
    const value = item.limit;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`limit ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`limit ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a weighted credit milestone. */
export class WeightedCreditMilestoneValidator {
  rules: WeightedCreditMilestoneRule[];

  constructor(rules: WeightedCreditMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedCreditMilestone): string[] {
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

  requireValid(item: WeightedCreditMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedCreditMilestone[]): Map<string, string[]> {
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

export function defaultWeightedCreditMilestoneValidator(): WeightedCreditMilestoneValidator {
  return new WeightedCreditMilestoneValidator(
    [
      new WeightedCreditMilestoneCodeLengthRule(120),
      new WeightedCreditMilestoneRequiredOwnerIdRule("weighted credit milestone needs this field"),
      new WeightedCreditMilestoneLimitRangeRule(120, 255),
    ],
  );
}
