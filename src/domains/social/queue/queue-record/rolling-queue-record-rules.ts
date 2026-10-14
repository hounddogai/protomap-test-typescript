import { RollingQueueRecord } from "./rolling-queue-record.js";

/** A rule a rolling queue record must pass. Check returns its problems, or none. */
export interface RollingQueueRecordRule {
  check(item: RollingQueueRecord): string[];
}

export class RollingQueueRecordMinimumRangeRule implements RollingQueueRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingQueueRecord): string[] {
    const value = item.minimum;
    if (value < this.min || value > this.max) return [`minimum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RollingQueueRecordReviewerLengthRule implements RollingQueueRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingQueueRecord): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingQueueRecordJourneyIdLengthRule implements RollingQueueRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingQueueRecord): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingQueueRecordRequiredCodeRule implements RollingQueueRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingQueueRecord): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RollingQueueRecordPinnedGuardRule implements RollingQueueRecordRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: RollingQueueRecord): string[] {
    if (item.pinned && item.minimum > this.limit) return [`minimum ${item.minimum} exceeds ${this.limit} while pinned`];
    return [];
  }
}

/** Runs every rule of a rolling queue record. */
export class RollingQueueRecordValidator {
  rules: RollingQueueRecordRule[];

  constructor(rules: RollingQueueRecordRule[]) {
    this.rules = rules;
  }

  validate(item: RollingQueueRecord): string[] {
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

  requireValid(item: RollingQueueRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingQueueRecord[]): Map<string, string[]> {
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

export function defaultRollingQueueRecordValidator(): RollingQueueRecordValidator {
  return new RollingQueueRecordValidator(
    [
      new RollingQueueRecordMinimumRangeRule(6.1, 2231.3),
      new RollingQueueRecordReviewerLengthRule(64),
      new RollingQueueRecordJourneyIdLengthRule(3600),
      new RollingQueueRecordRequiredCodeRule("rolling queue record needs an entry"),
      new RollingQueueRecordPinnedGuardRule(0.9),
    ],
  );
}
