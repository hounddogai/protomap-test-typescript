import * as text from "../../../../kit/text.js";
import { TieredNudgeSnapshot } from "./tiered-nudge-snapshot.js";

/** A rule a tiered nudge snapshot must pass. Check returns its problems, or none. */
export interface TieredNudgeSnapshotRule {
  check(item: TieredNudgeSnapshot): string[];
}

export class TieredNudgeSnapshotCodeLengthRule implements TieredNudgeSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredNudgeSnapshot): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredNudgeSnapshotAllowedCodeRule implements TieredNudgeSnapshotRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TieredNudgeSnapshot): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is too long`];
    return [];
  }
}

export class TieredNudgeSnapshotRequiredTitleRule implements TieredNudgeSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredNudgeSnapshot): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class TieredNudgeSnapshotPinnedGuardRule implements TieredNudgeSnapshotRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: TieredNudgeSnapshot): string[] {
    if (item.pinned && item.quantity > this.limit) return [`quantity ${item.quantity} exceeds ${this.limit} while pinned`];
    return [];
  }
}

/** Runs every rule of a tiered nudge snapshot. */
export class TieredNudgeSnapshotValidator {
  rules: TieredNudgeSnapshotRule[];

  constructor(rules: TieredNudgeSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: TieredNudgeSnapshot): string[] {
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

  requireValid(item: TieredNudgeSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredNudgeSnapshot[]): Map<string, string[]> {
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

export function defaultTieredNudgeSnapshotValidator(): TieredNudgeSnapshotValidator {
  return new TieredNudgeSnapshotValidator(
    [
      new TieredNudgeSnapshotCodeLengthRule(3600),
      new TieredNudgeSnapshotAllowedCodeRule(["regional", "scheduled"]),
      new TieredNudgeSnapshotRequiredTitleRule("tiered nudge snapshot needs an entry"),
      new TieredNudgeSnapshotPinnedGuardRule(80),
    ],
  );
}
