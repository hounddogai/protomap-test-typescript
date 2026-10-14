import * as text from "../../../../kit/text.js";
import { CappedTouchpointSnapshot } from "./capped-touchpoint-snapshot.js";

/** A rule a capped touchpoint snapshot must pass. Check returns its problems, or none. */
export interface CappedTouchpointSnapshotRule {
  check(item: CappedTouchpointSnapshot): string[];
}

export class CappedTouchpointSnapshotRequiredRegionRule implements CappedTouchpointSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedTouchpointSnapshot): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

export class CappedTouchpointSnapshotAllowedTitleRule implements CappedTouchpointSnapshotRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CappedTouchpointSnapshot): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is above maximum`];
    return [];
  }
}

export class CappedTouchpointSnapshotVisibleGuardRule implements CappedTouchpointSnapshotRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: CappedTouchpointSnapshot): string[] {
    if (item.visible && item.sendAt > this.limit) return [`send at ${item.sendAt} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class CappedTouchpointSnapshotRequiredTitleRule implements CappedTouchpointSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedTouchpointSnapshot): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a capped touchpoint snapshot. */
export class CappedTouchpointSnapshotValidator {
  rules: CappedTouchpointSnapshotRule[];

  constructor(rules: CappedTouchpointSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: CappedTouchpointSnapshot): string[] {
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

  requireValid(item: CappedTouchpointSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedTouchpointSnapshot[]): Map<string, string[]> {
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

export function defaultCappedTouchpointSnapshotValidator(): CappedTouchpointSnapshotValidator {
  return new CappedTouchpointSnapshotValidator(
    [
      new CappedTouchpointSnapshotRequiredRegionRule("capped touchpoint snapshot needs a value"),
      new CappedTouchpointSnapshotAllowedTitleRule(["primary", "capped"]),
      new CappedTouchpointSnapshotVisibleGuardRule(120),
      new CappedTouchpointSnapshotRequiredTitleRule("capped touchpoint snapshot needs an entry"),
    ],
  );
}
