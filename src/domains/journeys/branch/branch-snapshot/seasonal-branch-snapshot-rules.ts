import { SeasonalBranchSnapshot } from "./seasonal-branch-snapshot.js";

/** A rule a seasonal branch snapshot must pass. Check returns its problems, or none. */
export interface SeasonalBranchSnapshotRule {
  check(item: SeasonalBranchSnapshot): string[];
}

export class SeasonalBranchSnapshotRequiredNameRule implements SeasonalBranchSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalBranchSnapshot): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalBranchSnapshotActiveGuardRule implements SeasonalBranchSnapshotRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: SeasonalBranchSnapshot): string[] {
    if (item.active && item.ceiling > this.limit) return [`ceiling ${item.ceiling} exceeds ${this.limit} while active`];
    return [];
  }
}

export class SeasonalBranchSnapshotTitleLengthRule implements SeasonalBranchSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalBranchSnapshot): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a seasonal branch snapshot. */
export class SeasonalBranchSnapshotValidator {
  rules: SeasonalBranchSnapshotRule[];

  constructor(rules: SeasonalBranchSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalBranchSnapshot): string[] {
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

  requireValid(item: SeasonalBranchSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalBranchSnapshot[]): Map<string, string[]> {
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

export function defaultSeasonalBranchSnapshotValidator(): SeasonalBranchSnapshotValidator {
  return new SeasonalBranchSnapshotValidator(
    [
      new SeasonalBranchSnapshotRequiredNameRule("seasonal branch snapshot needs this field"),
      new SeasonalBranchSnapshotActiveGuardRule(4.8),
      new SeasonalBranchSnapshotTitleLengthRule(255),
    ],
  );
}
