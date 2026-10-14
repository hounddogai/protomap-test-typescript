import * as text from "../../../../kit/text.js";
import { PlacementSnapshot } from "./placement-snapshot.js";

/** A rule a placement snapshot must pass. Check returns its problems, or none. */
export interface PlacementSnapshotRule {
  check(item: PlacementSnapshot): string[];
}

export class PlacementSnapshotRateRangeRule implements PlacementSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PlacementSnapshot): string[] {
    const value = item.rate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PlacementSnapshotAllowedLocaleRule implements PlacementSnapshotRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PlacementSnapshot): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.locale))) return [`locale ${item.locale} is above maximum`];
    return [];
  }
}

export class PlacementSnapshotRequiredCountryRule implements PlacementSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PlacementSnapshot): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class PlacementSnapshotAttemptsRangeRule implements PlacementSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PlacementSnapshot): string[] {
    const value = item.attempts;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`attempts ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`attempts ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a placement snapshot. */
export class PlacementSnapshotValidator {
  rules: PlacementSnapshotRule[];

  constructor(rules: PlacementSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: PlacementSnapshot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PlacementSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PlacementSnapshot[]): Map<string, string[]> {
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

export function defaultPlacementSnapshotValidator(): PlacementSnapshotValidator {
  return new PlacementSnapshotValidator(
    [
      new PlacementSnapshotRateRangeRule(0.7, 4840.8),
      new PlacementSnapshotAllowedLocaleRule(["legacy", "adaptive", "capped"]),
      new PlacementSnapshotRequiredCountryRule("placement snapshot needs an entry"),
      new PlacementSnapshotAttemptsRangeRule(120, 255),
    ],
  );
}
