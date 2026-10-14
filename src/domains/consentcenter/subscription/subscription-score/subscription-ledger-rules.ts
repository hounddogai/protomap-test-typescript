import { SubscriptionLedger } from "./subscription-ledger.js";

/** A rule a subscription ledger must pass. Check returns its problems, or none. */
export interface SubscriptionLedgerRule {
  check(item: SubscriptionLedger): string[];
}

export class SubscriptionLedgerSequenceRangeRule implements SubscriptionLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SubscriptionLedger): string[] {
    const value = item.sequence;
    if (value < this.min || value > this.max) return [`sequence ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SubscriptionLedgerAudienceIdLengthRule implements SubscriptionLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SubscriptionLedger): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SubscriptionLedgerCreatedAtRangeRule implements SubscriptionLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SubscriptionLedger): string[] {
    const value = item.createdAt;
    if (value < this.min || value > this.max) return [`created at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SubscriptionLedgerArchivedGuardRule implements SubscriptionLedgerRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: SubscriptionLedger): string[] {
    if (item.archived && item.createdAt > this.limit) return [`created at ${item.createdAt} exceeds ${this.limit} while archived`];
    return [];
  }
}

/** Runs every rule of a subscription ledger. */
export class SubscriptionLedgerValidator {
  rules: SubscriptionLedgerRule[];

  constructor(rules: SubscriptionLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: SubscriptionLedger): string[] {
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

  requireValid(item: SubscriptionLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SubscriptionLedger[]): Map<string, string[]> {
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

export function defaultSubscriptionLedgerValidator(): SubscriptionLedgerValidator {
  return new SubscriptionLedgerValidator(
    [
      new SubscriptionLedgerSequenceRangeRule(80, 3600),
      new SubscriptionLedgerAudienceIdLengthRule(255),
      new SubscriptionLedgerCreatedAtRangeRule(64, 255),
      new SubscriptionLedgerArchivedGuardRule(1000),
    ],
  );
}
