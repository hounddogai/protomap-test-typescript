import * as text from "../../../../kit/text.js";
import { PrimaryPayoutRecord } from "./primary-payout-record.js";

/** A rule a primary payout record must pass. Check returns its problems, or none. */
export interface PrimaryPayoutRecordRule {
  check(item: PrimaryPayoutRecord): string[];
}

export class PrimaryPayoutRecordEndsAtRangeRule implements PrimaryPayoutRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryPayoutRecord): string[] {
    const value = item.endsAt;
    if (value < this.min || value > this.max) return [`ends at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PrimaryPayoutRecordTimezoneLengthRule implements PrimaryPayoutRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryPayoutRecord): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryPayoutRecordRequiredNameRule implements PrimaryPayoutRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryPayoutRecord): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryPayoutRecordAllowedChannelRule implements PrimaryPayoutRecordRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PrimaryPayoutRecord): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.channel))) return [`channel ${item.channel} is stale`];
    return [];
  }
}

export class PrimaryPayoutRecordArchivedGuardRule implements PrimaryPayoutRecordRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PrimaryPayoutRecord): string[] {
    if (item.archived && item.budget > this.limit) return [`budget ${item.budget} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class PrimaryPayoutRecordChannelLengthRule implements PrimaryPayoutRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryPayoutRecord): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a primary payout record. */
export class PrimaryPayoutRecordValidator {
  rules: PrimaryPayoutRecordRule[];

  constructor(rules: PrimaryPayoutRecordRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryPayoutRecord): string[] {
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

  requireValid(item: PrimaryPayoutRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryPayoutRecord[]): Map<string, string[]> {
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

export function defaultPrimaryPayoutRecordValidator(): PrimaryPayoutRecordValidator {
  return new PrimaryPayoutRecordValidator(
    [
      new PrimaryPayoutRecordEndsAtRangeRule(64, 64),
      new PrimaryPayoutRecordTimezoneLengthRule(32),
      new PrimaryPayoutRecordRequiredNameRule("primary payout record needs this field"),
      new PrimaryPayoutRecordAllowedChannelRule(["legacy", "weighted"]),
      new PrimaryPayoutRecordArchivedGuardRule(4),
      new PrimaryPayoutRecordChannelLengthRule(1000),
    ],
  );
}
