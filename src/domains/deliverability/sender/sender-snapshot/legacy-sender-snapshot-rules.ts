import * as text from "../../../../kit/text.js";
import { LegacySenderSnapshot } from "./legacy-sender-snapshot.js";

/** A rule a legacy sender snapshot must pass. Check returns its problems, or none. */
export interface LegacySenderSnapshotRule {
  check(item: LegacySenderSnapshot): string[];
}

export class LegacySenderSnapshotActiveGuardRule implements LegacySenderSnapshotRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: LegacySenderSnapshot): string[] {
    if (item.active && item.windowDays > this.limit) return [`window days ${item.windowDays} exceeds ${this.limit} while active`];
    return [];
  }
}

export class LegacySenderSnapshotAllowedNameRule implements LegacySenderSnapshotRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LegacySenderSnapshot): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is not allowed`];
    return [];
  }
}

export class LegacySenderSnapshotCodePrefixRule implements LegacySenderSnapshotRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LegacySenderSnapshot): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LegacySenderSnapshotRequiredCodeRule implements LegacySenderSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacySenderSnapshot): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LegacySenderSnapshotUpdatedAtRangeRule implements LegacySenderSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacySenderSnapshot): string[] {
    const value = item.updatedAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`updated at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`updated at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LegacySenderSnapshotWindowDaysRangeRule implements LegacySenderSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacySenderSnapshot): string[] {
    const value = item.windowDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`window days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`window days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a legacy sender snapshot. */
export class LegacySenderSnapshotValidator {
  rules: LegacySenderSnapshotRule[];

  constructor(rules: LegacySenderSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: LegacySenderSnapshot): string[] {
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

  requireValid(item: LegacySenderSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacySenderSnapshot[]): Map<string, string[]> {
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

export function defaultLegacySenderSnapshotValidator(): LegacySenderSnapshotValidator {
  return new LegacySenderSnapshotValidator(
    [
      new LegacySenderSnapshotActiveGuardRule(16),
      new LegacySenderSnapshotAllowedNameRule(["adaptive"]),
      new LegacySenderSnapshotCodePrefixRule("Q"),
      new LegacySenderSnapshotRequiredCodeRule("legacy sender snapshot needs a value"),
      new LegacySenderSnapshotUpdatedAtRangeRule(16, 64),
      new LegacySenderSnapshotWindowDaysRangeRule(80, 86400),
    ],
  );
}
