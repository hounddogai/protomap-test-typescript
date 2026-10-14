import { BranchSnapshot } from "./branch-snapshot.js";

/** A rule a branch snapshot must pass. Check returns its problems, or none. */
export interface BranchSnapshotRule {
  check(item: BranchSnapshot): string[];
}

export class BranchSnapshotOpenRateRangeRule implements BranchSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BranchSnapshot): string[] {
    const value = item.openRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`open rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`open rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BranchSnapshotScoreRangeRule implements BranchSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BranchSnapshot): string[] {
    const value = item.score;
    if (value < this.min || value > this.max) return [`score ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BranchSnapshotArchivedGuardRule implements BranchSnapshotRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: BranchSnapshot): string[] {
    if (item.archived && item.priority > this.limit) return [`priority ${item.priority} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class BranchSnapshotRequiredRegionRule implements BranchSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BranchSnapshot): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

export class BranchSnapshotCodePrefixRule implements BranchSnapshotRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BranchSnapshot): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a branch snapshot. */
export class BranchSnapshotValidator {
  rules: BranchSnapshotRule[];

  constructor(rules: BranchSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: BranchSnapshot): string[] {
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

  requireValid(item: BranchSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BranchSnapshot[]): Map<string, string[]> {
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

export function defaultBranchSnapshotValidator(): BranchSnapshotValidator {
  return new BranchSnapshotValidator(
    [
      new BranchSnapshotOpenRateRangeRule(4.8, 4094.4),
      new BranchSnapshotScoreRangeRule(8.2, 470.7),
      new BranchSnapshotArchivedGuardRule(64),
      new BranchSnapshotRequiredRegionRule("branch snapshot needs this field"),
      new BranchSnapshotCodePrefixRule("ACM"),
    ],
  );
}
