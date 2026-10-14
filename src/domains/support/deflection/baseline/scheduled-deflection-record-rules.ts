import { ScheduledDeflectionRecord } from "./scheduled-deflection-record.js";

/** A rule a scheduled deflection record must pass. Check returns its problems, or none. */
export interface ScheduledDeflectionRecordRule {
  check(item: ScheduledDeflectionRecord): string[];
}

export class ScheduledDeflectionRecordArchivedGuardRule implements ScheduledDeflectionRecordRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: ScheduledDeflectionRecord): string[] {
    if (item.archived && item.updatedAt > this.limit) return [`updated at ${item.updatedAt} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class ScheduledDeflectionRecordLabelLengthRule implements ScheduledDeflectionRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledDeflectionRecord): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledDeflectionRecordSummaryLengthRule implements ScheduledDeflectionRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledDeflectionRecord): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledDeflectionRecordCodePrefixRule implements ScheduledDeflectionRecordRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ScheduledDeflectionRecord): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a scheduled deflection record. */
export class ScheduledDeflectionRecordValidator {
  rules: ScheduledDeflectionRecordRule[];

  constructor(rules: ScheduledDeflectionRecordRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledDeflectionRecord): string[] {
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

  requireValid(item: ScheduledDeflectionRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledDeflectionRecord[]): Map<string, string[]> {
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

export function defaultScheduledDeflectionRecordValidator(): ScheduledDeflectionRecordValidator {
  return new ScheduledDeflectionRecordValidator(
    [
      new ScheduledDeflectionRecordArchivedGuardRule(64),
      new ScheduledDeflectionRecordLabelLengthRule(32),
      new ScheduledDeflectionRecordSummaryLengthRule(1000),
      new ScheduledDeflectionRecordCodePrefixRule("ACM"),
    ],
  );
}
