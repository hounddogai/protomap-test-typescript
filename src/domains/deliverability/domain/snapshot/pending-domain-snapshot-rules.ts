import { PendingDomainSnapshot } from "./pending-domain-snapshot.js";

/** A rule a pending domain snapshot must pass. Check returns its problems, or none. */
export interface PendingDomainSnapshotRule {
  check(item: PendingDomainSnapshot): string[];
}

export class PendingDomainSnapshotCapacityRangeRule implements PendingDomainSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingDomainSnapshot): string[] {
    const value = item.capacity;
    if (value < this.min || value > this.max) return [`capacity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PendingDomainSnapshotCodeLengthRule implements PendingDomainSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingDomainSnapshot): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingDomainSnapshotRequiredTimezoneRule implements PendingDomainSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingDomainSnapshot): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a pending domain snapshot. */
export class PendingDomainSnapshotValidator {
  rules: PendingDomainSnapshotRule[];

  constructor(rules: PendingDomainSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: PendingDomainSnapshot): string[] {
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

  requireValid(item: PendingDomainSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingDomainSnapshot[]): Map<string, string[]> {
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

export function defaultPendingDomainSnapshotValidator(): PendingDomainSnapshotValidator {
  return new PendingDomainSnapshotValidator(
    [
      new PendingDomainSnapshotCapacityRangeRule(80, 86400),
      new PendingDomainSnapshotCodeLengthRule(32),
      new PendingDomainSnapshotRequiredTimezoneRule("pending domain snapshot needs an entry"),
    ],
  );
}
