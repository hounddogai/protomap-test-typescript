import * as text from "../../../../kit/text.js";
import { RollingTicketViewRollup } from "./rolling-ticket-view-rollup.js";

/** A rule a rolling ticket view rollup must pass. Check returns its problems, or none. */
export interface RollingTicketViewRollupRule {
  check(item: RollingTicketViewRollup): string[];
}

export class RollingTicketViewRollupAllowedNameRule implements RollingTicketViewRollupRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RollingTicketViewRollup): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is missing`];
    return [];
  }
}

export class RollingTicketViewRollupCreatedAtRangeRule implements RollingTicketViewRollupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingTicketViewRollup): string[] {
    const value = item.createdAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`created at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`created at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RollingTicketViewRollupPinnedGuardRule implements RollingTicketViewRollupRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: RollingTicketViewRollup): string[] {
    if (item.pinned && item.createdAt > this.limit) return [`created at ${item.createdAt} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class RollingTicketViewRollupBatchSizeRangeRule implements RollingTicketViewRollupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingTicketViewRollup): string[] {
    const value = item.batchSize;
    if (value < this.min || value > this.max) return [`batch size ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a rolling ticket view rollup. */
export class RollingTicketViewRollupValidator {
  rules: RollingTicketViewRollupRule[];

  constructor(rules: RollingTicketViewRollupRule[]) {
    this.rules = rules;
  }

  validate(item: RollingTicketViewRollup): string[] {
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

  requireValid(item: RollingTicketViewRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingTicketViewRollup[]): Map<string, string[]> {
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

export function defaultRollingTicketViewRollupValidator(): RollingTicketViewRollupValidator {
  return new RollingTicketViewRollupValidator(
    [
      new RollingTicketViewRollupAllowedNameRule(["primary"]),
      new RollingTicketViewRollupCreatedAtRangeRule(3600, 3600),
      new RollingTicketViewRollupPinnedGuardRule(3600),
      new RollingTicketViewRollupBatchSizeRangeRule(80, 255),
    ],
  );
}
