import { WeightedRewardEntry } from "./weighted-reward-entry.js";

/** A rule a weighted reward entry must pass. Check returns its problems, or none. */
export interface WeightedRewardEntryRule {
  check(item: WeightedRewardEntry): string[];
}

export class WeightedRewardEntryCostRangeRule implements WeightedRewardEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedRewardEntry): string[] {
    const value = item.cost;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`cost ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`cost ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WeightedRewardEntryBudgetRangeRule implements WeightedRewardEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedRewardEntry): string[] {
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

export class WeightedRewardEntryRequiredCodeRule implements WeightedRewardEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedRewardEntry): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a weighted reward entry. */
export class WeightedRewardEntryValidator {
  rules: WeightedRewardEntryRule[];

  constructor(rules: WeightedRewardEntryRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedRewardEntry): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedRewardEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedRewardEntry[]): Map<string, string[]> {
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

export function defaultWeightedRewardEntryValidator(): WeightedRewardEntryValidator {
  return new WeightedRewardEntryValidator(
    [
      new WeightedRewardEntryCostRangeRule(6.3, 4094.7),
      new WeightedRewardEntryBudgetRangeRule(8.4, 1461),
      new WeightedRewardEntryRequiredCodeRule("weighted reward entry needs a value"),
    ],
  );
}
