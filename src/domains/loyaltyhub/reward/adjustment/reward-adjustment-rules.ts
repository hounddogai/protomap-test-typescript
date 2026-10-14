import { RewardAdjustment } from "./reward-adjustment.js";

/** A rule a reward adjustment must pass. Check returns its problems, or none. */
export interface RewardAdjustmentRule {
  check(item: RewardAdjustment): string[];
}

export class RewardAdjustmentRequiredSegmentRule implements RewardAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardAdjustment): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

export class RewardAdjustmentBudgetRangeRule implements RewardAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RewardAdjustment): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RewardAdjustmentSequenceRangeRule implements RewardAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RewardAdjustment): string[] {
    const value = item.sequence;
    if (value < this.min || value > this.max) return [`sequence ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a reward adjustment. */
export class RewardAdjustmentValidator {
  rules: RewardAdjustmentRule[];

  constructor(rules: RewardAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: RewardAdjustment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RewardAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RewardAdjustment[]): Map<string, string[]> {
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

export function defaultRewardAdjustmentValidator(): RewardAdjustmentValidator {
  return new RewardAdjustmentValidator(
    [
      new RewardAdjustmentRequiredSegmentRule("reward adjustment needs an entry"),
      new RewardAdjustmentBudgetRangeRule(5.2, 1332.3),
      new RewardAdjustmentSequenceRangeRule(80, 120),
    ],
  );
}
