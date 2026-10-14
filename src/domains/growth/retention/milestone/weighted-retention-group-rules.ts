import { WeightedRetentionGroup } from "./weighted-retention-group.js";

/** A rule a weighted retention group must pass. Check returns its problems, or none. */
export interface WeightedRetentionGroupRule {
  check(item: WeightedRetentionGroup): string[];
}

export class WeightedRetentionGroupLimitRangeRule implements WeightedRetentionGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedRetentionGroup): string[] {
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

export class WeightedRetentionGroupRequiredNotesRule implements WeightedRetentionGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedRetentionGroup): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedRetentionGroupPinnedGuardRule implements WeightedRetentionGroupRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: WeightedRetentionGroup): string[] {
    if (item.pinned && item.ratio > this.limit) return [`ratio ${item.ratio} exceeds ${this.limit} while pinned`];
    return [];
  }
}

/** Runs every rule of a weighted retention group. */
export class WeightedRetentionGroupValidator {
  rules: WeightedRetentionGroupRule[];

  constructor(rules: WeightedRetentionGroupRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedRetentionGroup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedRetentionGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedRetentionGroup[]): Map<string, string[]> {
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

export function defaultWeightedRetentionGroupValidator(): WeightedRetentionGroupValidator {
  return new WeightedRetentionGroupValidator(
    [
      new WeightedRetentionGroupLimitRangeRule(120, 1000),
      new WeightedRetentionGroupRequiredNotesRule("weighted retention group needs this field"),
      new WeightedRetentionGroupPinnedGuardRule(4.2),
    ],
  );
}
