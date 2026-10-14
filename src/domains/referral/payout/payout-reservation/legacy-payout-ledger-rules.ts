import { LegacyPayoutLedger } from "./legacy-payout-ledger.js";

/** A rule a legacy payout ledger must pass. Check returns its problems, or none. */
export interface LegacyPayoutLedgerRule {
  check(item: LegacyPayoutLedger): string[];
}

export class LegacyPayoutLedgerCostRangeRule implements LegacyPayoutLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyPayoutLedger): string[] {
    const value = item.cost;
    if (value < this.min || value > this.max) return [`cost ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LegacyPayoutLedgerTimezoneLengthRule implements LegacyPayoutLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyPayoutLedger): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyPayoutLedgerNameLengthRule implements LegacyPayoutLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyPayoutLedger): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyPayoutLedgerRequiredCodeRule implements LegacyPayoutLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyPayoutLedger): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyPayoutLedgerRequiredTimezoneRule implements LegacyPayoutLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyPayoutLedger): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyPayoutLedgerRequiredCampaignRefRule implements LegacyPayoutLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyPayoutLedger): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a legacy payout ledger. */
export class LegacyPayoutLedgerValidator {
  rules: LegacyPayoutLedgerRule[];

  constructor(rules: LegacyPayoutLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyPayoutLedger): string[] {
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

  requireValid(item: LegacyPayoutLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyPayoutLedger[]): Map<string, string[]> {
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

export function defaultLegacyPayoutLedgerValidator(): LegacyPayoutLedgerValidator {
  return new LegacyPayoutLedgerValidator(
    [
      new LegacyPayoutLedgerCostRangeRule(4.2, 3412.2),
      new LegacyPayoutLedgerTimezoneLengthRule(3600),
      new LegacyPayoutLedgerNameLengthRule(32),
      new LegacyPayoutLedgerRequiredCodeRule("legacy payout ledger needs a value"),
      new LegacyPayoutLedgerRequiredTimezoneRule("legacy payout ledger needs a value"),
      new LegacyPayoutLedgerRequiredCampaignRefRule("legacy payout ledger needs an entry"),
    ],
  );
}
