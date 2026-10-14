import { BadgeSnapshot } from "./badge-snapshot.js";

/** A rule a badge snapshot must pass. Check returns its problems, or none. */
export interface BadgeSnapshotRule {
  check(item: BadgeSnapshot): string[];
}

export class BadgeSnapshotActiveGuardRule implements BadgeSnapshotRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: BadgeSnapshot): string[] {
    if (item.active && item.durationMinutes > this.limit) return [`duration minutes ${item.durationMinutes} exceeds ${this.limit} while active`];
    return [];
  }
}

export class BadgeSnapshotContactEmailLengthRule implements BadgeSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BadgeSnapshot): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BadgeSnapshotRequiredLabelRule implements BadgeSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BadgeSnapshot): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a badge snapshot. */
export class BadgeSnapshotValidator {
  rules: BadgeSnapshotRule[];

  constructor(rules: BadgeSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: BadgeSnapshot): string[] {
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

  requireValid(item: BadgeSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BadgeSnapshot[]): Map<string, string[]> {
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

export function defaultBadgeSnapshotValidator(): BadgeSnapshotValidator {
  return new BadgeSnapshotValidator(
    [
      new BadgeSnapshotActiveGuardRule(32),
      new BadgeSnapshotContactEmailLengthRule(120),
      new BadgeSnapshotRequiredLabelRule("badge snapshot needs a value"),
    ],
  );
}
