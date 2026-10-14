import * as text from "../../../../kit/text.js";
import { TieredQueueLedger } from "./tiered-queue-ledger.js";

/** A rule a tiered queue ledger must pass. Check returns its problems, or none. */
export interface TieredQueueLedgerRule {
  check(item: TieredQueueLedger): string[];
}

export class TieredQueueLedgerRequiredTitleRule implements TieredQueueLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredQueueLedger): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class TieredQueueLedgerRequiredAudienceIdRule implements TieredQueueLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredQueueLedger): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

export class TieredQueueLedgerStartsAtRangeRule implements TieredQueueLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredQueueLedger): string[] {
    const value = item.startsAt;
    if (value < this.min || value > this.max) return [`starts at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredQueueLedgerCodePrefixRule implements TieredQueueLedgerRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TieredQueueLedger): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class TieredQueueLedgerAllowedAudienceIdRule implements TieredQueueLedgerRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TieredQueueLedger): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.audienceId))) return [`audience id ${item.audienceId} is below minimum`];
    return [];
  }
}

export class TieredQueueLedgerLimitRangeRule implements TieredQueueLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredQueueLedger): string[] {
    const value = item.limit;
    if (value < this.min || value > this.max) return [`limit ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a tiered queue ledger. */
export class TieredQueueLedgerValidator {
  rules: TieredQueueLedgerRule[];

  constructor(rules: TieredQueueLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: TieredQueueLedger): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredQueueLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredQueueLedger[]): Map<string, string[]> {
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

export function defaultTieredQueueLedgerValidator(): TieredQueueLedgerValidator {
  return new TieredQueueLedgerValidator(
    [
      new TieredQueueLedgerRequiredTitleRule("tiered queue ledger needs an entry"),
      new TieredQueueLedgerRequiredAudienceIdRule("tiered queue ledger needs an entry"),
      new TieredQueueLedgerStartsAtRangeRule(1000, 3600),
      new TieredQueueLedgerCodePrefixRule("OPS"),
      new TieredQueueLedgerAllowedAudienceIdRule([]),
      new TieredQueueLedgerLimitRangeRule(16, 1000),
    ],
  );
}
