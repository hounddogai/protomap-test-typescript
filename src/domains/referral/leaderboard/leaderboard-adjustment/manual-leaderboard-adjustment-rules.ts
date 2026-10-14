import * as text from "../../../../kit/text.js";
import { ManualLeaderboardAdjustment } from "./manual-leaderboard-adjustment.js";

/** A rule a manual leaderboard adjustment must pass. Check returns its problems, or none. */
export interface ManualLeaderboardAdjustmentRule {
  check(item: ManualLeaderboardAdjustment): string[];
}

export class ManualLeaderboardAdjustmentAmountRangeRule implements ManualLeaderboardAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualLeaderboardAdjustment): string[] {
    const value = item.amount;
    if (value < this.min || value > this.max) return [`amount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ManualLeaderboardAdjustmentPinnedGuardRule implements ManualLeaderboardAdjustmentRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: ManualLeaderboardAdjustment): string[] {
    if (item.pinned && item.capacity > this.limit) return [`capacity ${item.capacity} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class ManualLeaderboardAdjustmentAllowedExternalRefRule implements ManualLeaderboardAdjustmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ManualLeaderboardAdjustment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.externalRef))) return [`external ref ${item.externalRef} is inconsistent`];
    return [];
  }
}

/** Runs every rule of a manual leaderboard adjustment. */
export class ManualLeaderboardAdjustmentValidator {
  rules: ManualLeaderboardAdjustmentRule[];

  constructor(rules: ManualLeaderboardAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: ManualLeaderboardAdjustment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualLeaderboardAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualLeaderboardAdjustment[]): Map<string, string[]> {
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

export function defaultManualLeaderboardAdjustmentValidator(): ManualLeaderboardAdjustmentValidator {
  return new ManualLeaderboardAdjustmentValidator(
    [
      new ManualLeaderboardAdjustmentAmountRangeRule(2.7, 3537.6),
      new ManualLeaderboardAdjustmentPinnedGuardRule(80),
      new ManualLeaderboardAdjustmentAllowedExternalRefRule(["tiered", "seasonal"]),
    ],
  );
}
