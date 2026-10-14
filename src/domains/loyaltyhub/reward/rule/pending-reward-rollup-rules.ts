import { PendingRewardRollup } from "./pending-reward-rollup.js";

/** A rule a pending reward rollup must pass. Check returns its problems, or none. */
export interface PendingRewardRollupRule {
  check(item: PendingRewardRollup): string[];
}

export class PendingRewardRollupQuantityRangeRule implements PendingRewardRollupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingRewardRollup): string[] {
    const value = item.quantity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`quantity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`quantity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PendingRewardRollupRequiredTitleRule implements PendingRewardRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingRewardRollup): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class PendingRewardRollupBudgetRangeRule implements PendingRewardRollupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingRewardRollup): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a pending reward rollup. */
export class PendingRewardRollupValidator {
  rules: PendingRewardRollupRule[];

  constructor(rules: PendingRewardRollupRule[]) {
    this.rules = rules;
  }

  validate(item: PendingRewardRollup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PendingRewardRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingRewardRollup[]): Map<string, string[]> {
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

export function defaultPendingRewardRollupValidator(): PendingRewardRollupValidator {
  return new PendingRewardRollupValidator(
    [
      new PendingRewardRollupQuantityRangeRule(64, 120),
      new PendingRewardRollupRequiredTitleRule("pending reward rollup needs this field"),
      new PendingRewardRollupBudgetRangeRule(8.8, 2820.9),
    ],
  );
}
