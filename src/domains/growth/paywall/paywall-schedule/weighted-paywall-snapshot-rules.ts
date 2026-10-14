import { WeightedPaywallSnapshot } from "./weighted-paywall-snapshot.js";

/** A rule a weighted paywall snapshot must pass. Check returns its problems, or none. */
export interface WeightedPaywallSnapshotRule {
  check(item: WeightedPaywallSnapshot): string[];
}

export class WeightedPaywallSnapshotSequenceRangeRule implements WeightedPaywallSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedPaywallSnapshot): string[] {
    const value = item.sequence;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`sequence ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`sequence ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WeightedPaywallSnapshotRequiredVariantRule implements WeightedPaywallSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedPaywallSnapshot): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedPaywallSnapshotRequiredCodeRule implements WeightedPaywallSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedPaywallSnapshot): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedPaywallSnapshotRequiredOwnerIdRule implements WeightedPaywallSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedPaywallSnapshot): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a weighted paywall snapshot. */
export class WeightedPaywallSnapshotValidator {
  rules: WeightedPaywallSnapshotRule[];

  constructor(rules: WeightedPaywallSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedPaywallSnapshot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedPaywallSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedPaywallSnapshot[]): Map<string, string[]> {
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

export function defaultWeightedPaywallSnapshotValidator(): WeightedPaywallSnapshotValidator {
  return new WeightedPaywallSnapshotValidator(
    [
      new WeightedPaywallSnapshotSequenceRangeRule(3600, 3600),
      new WeightedPaywallSnapshotRequiredVariantRule("weighted paywall snapshot needs a value"),
      new WeightedPaywallSnapshotRequiredCodeRule("weighted paywall snapshot needs an entry"),
      new WeightedPaywallSnapshotRequiredOwnerIdRule("weighted paywall snapshot needs a value"),
    ],
  );
}
