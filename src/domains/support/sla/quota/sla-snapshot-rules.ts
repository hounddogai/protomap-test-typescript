import { SlaSnapshot } from "./sla-snapshot.js";

/** A rule a sla snapshot must pass. Check returns its problems, or none. */
export interface SlaSnapshotRule {
  check(item: SlaSnapshot): string[];
}

export class SlaSnapshotLocaleLengthRule implements SlaSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SlaSnapshot): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SlaSnapshotNameLengthRule implements SlaSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SlaSnapshot): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SlaSnapshotPinnedGuardRule implements SlaSnapshotRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: SlaSnapshot): string[] {
    if (item.pinned && item.amount > this.limit) return [`amount ${item.amount} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class SlaSnapshotCodePrefixRule implements SlaSnapshotRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SlaSnapshot): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SlaSnapshotRequiredCodeRule implements SlaSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SlaSnapshot): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a sla snapshot. */
export class SlaSnapshotValidator {
  rules: SlaSnapshotRule[];

  constructor(rules: SlaSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: SlaSnapshot): string[] {
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

  requireValid(item: SlaSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SlaSnapshot[]): Map<string, string[]> {
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

export function defaultSlaSnapshotValidator(): SlaSnapshotValidator {
  return new SlaSnapshotValidator(
    [
      new SlaSnapshotLocaleLengthRule(32),
      new SlaSnapshotNameLengthRule(120),
      new SlaSnapshotPinnedGuardRule(5.3),
      new SlaSnapshotCodePrefixRule("ACM"),
      new SlaSnapshotRequiredCodeRule("sla snapshot needs an entry"),
    ],
  );
}
