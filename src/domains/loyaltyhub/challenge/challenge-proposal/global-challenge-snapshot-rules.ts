import { GlobalChallengeSnapshot } from "./global-challenge-snapshot.js";

/** A rule a global challenge snapshot must pass. Check returns its problems, or none. */
export interface GlobalChallengeSnapshotRule {
  check(item: GlobalChallengeSnapshot): string[];
}

export class GlobalChallengeSnapshotBidRangeRule implements GlobalChallengeSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalChallengeSnapshot): string[] {
    const value = item.bid;
    if (value < this.min || value > this.max) return [`bid ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class GlobalChallengeSnapshotRequiredCountryRule implements GlobalChallengeSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalChallengeSnapshot): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalChallengeSnapshotMarginRangeRule implements GlobalChallengeSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalChallengeSnapshot): string[] {
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

export class GlobalChallengeSnapshotRequiredUnitRule implements GlobalChallengeSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalChallengeSnapshot): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a global challenge snapshot. */
export class GlobalChallengeSnapshotValidator {
  rules: GlobalChallengeSnapshotRule[];

  constructor(rules: GlobalChallengeSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalChallengeSnapshot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalChallengeSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalChallengeSnapshot[]): Map<string, string[]> {
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

export function defaultGlobalChallengeSnapshotValidator(): GlobalChallengeSnapshotValidator {
  return new GlobalChallengeSnapshotValidator(
    [
      new GlobalChallengeSnapshotBidRangeRule(4.8, 2106.3),
      new GlobalChallengeSnapshotRequiredCountryRule("global challenge snapshot needs a value"),
      new GlobalChallengeSnapshotMarginRangeRule(5.5, 367.5),
      new GlobalChallengeSnapshotRequiredUnitRule("global challenge snapshot needs a value"),
    ],
  );
}
