import { WeightedPlacementSnapshot } from "./weighted-placement-snapshot.js";

/** A rule a weighted placement snapshot must pass. Check returns its problems, or none. */
export interface WeightedPlacementSnapshotRule {
  check(item: WeightedPlacementSnapshot): string[];
}

export class WeightedPlacementSnapshotRequiredCodeRule implements WeightedPlacementSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedPlacementSnapshot): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedPlacementSnapshotRequiredCategoryRule implements WeightedPlacementSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedPlacementSnapshot): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedPlacementSnapshotCategoryLengthRule implements WeightedPlacementSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedPlacementSnapshot): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a weighted placement snapshot. */
export class WeightedPlacementSnapshotValidator {
  rules: WeightedPlacementSnapshotRule[];

  constructor(rules: WeightedPlacementSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedPlacementSnapshot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedPlacementSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedPlacementSnapshot[]): Map<string, string[]> {
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

export function defaultWeightedPlacementSnapshotValidator(): WeightedPlacementSnapshotValidator {
  return new WeightedPlacementSnapshotValidator(
    [
      new WeightedPlacementSnapshotRequiredCodeRule("weighted placement snapshot needs an entry"),
      new WeightedPlacementSnapshotRequiredCategoryRule("weighted placement snapshot needs a value"),
      new WeightedPlacementSnapshotCategoryLengthRule(255),
    ],
  );
}
