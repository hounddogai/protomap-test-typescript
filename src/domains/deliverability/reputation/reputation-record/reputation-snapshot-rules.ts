import * as text from "../../../../kit/text.js";
import { ReputationSnapshot } from "./reputation-snapshot.js";

/** A rule a reputation snapshot must pass. Check returns its problems, or none. */
export interface ReputationSnapshotRule {
  check(item: ReputationSnapshot): string[];
}

export class ReputationSnapshotAllowedOwnerIdRule implements ReputationSnapshotRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ReputationSnapshot): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.ownerId))) return [`owner id ${item.ownerId} is blocked`];
    return [];
  }
}

export class ReputationSnapshotRequiredSummaryRule implements ReputationSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReputationSnapshot): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

export class ReputationSnapshotApprovedGuardRule implements ReputationSnapshotRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: ReputationSnapshot): string[] {
    if (item.approved && item.createdAt > this.limit) return [`created at ${item.createdAt} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class ReputationSnapshotRequiredCohortRule implements ReputationSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReputationSnapshot): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

export class ReputationSnapshotRequiredTitleRule implements ReputationSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReputationSnapshot): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class ReputationSnapshotCodeLengthRule implements ReputationSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReputationSnapshot): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a reputation snapshot. */
export class ReputationSnapshotValidator {
  rules: ReputationSnapshotRule[];

  constructor(rules: ReputationSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: ReputationSnapshot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ReputationSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ReputationSnapshot[]): Map<string, string[]> {
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

export function defaultReputationSnapshotValidator(): ReputationSnapshotValidator {
  return new ReputationSnapshotValidator(
    [
      new ReputationSnapshotAllowedOwnerIdRule(["regional"]),
      new ReputationSnapshotRequiredSummaryRule("reputation snapshot needs a value"),
      new ReputationSnapshotApprovedGuardRule(32),
      new ReputationSnapshotRequiredCohortRule("reputation snapshot needs an entry"),
      new ReputationSnapshotRequiredTitleRule("reputation snapshot needs a value"),
      new ReputationSnapshotCodeLengthRule(32),
    ],
  );
}
