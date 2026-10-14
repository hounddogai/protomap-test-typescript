import * as text from "../../../../kit/text.js";
import { SeasonalPayoutLedger } from "./seasonal-payout-ledger.js";

/** A rule a seasonal payout ledger must pass. Check returns its problems, or none. */
export interface SeasonalPayoutLedgerRule {
  check(item: SeasonalPayoutLedger): string[];
}

export class SeasonalPayoutLedgerCodeLengthRule implements SeasonalPayoutLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalPayoutLedger): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalPayoutLedgerAllowedChannelRule implements SeasonalPayoutLedgerRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SeasonalPayoutLedger): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.channel))) return [`channel ${item.channel} is expired`];
    return [];
  }
}

export class SeasonalPayoutLedgerRequiredChannelRule implements SeasonalPayoutLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalPayoutLedger): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a seasonal payout ledger. */
export class SeasonalPayoutLedgerValidator {
  rules: SeasonalPayoutLedgerRule[];

  constructor(rules: SeasonalPayoutLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalPayoutLedger): string[] {
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

  requireValid(item: SeasonalPayoutLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalPayoutLedger[]): Map<string, string[]> {
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

export function defaultSeasonalPayoutLedgerValidator(): SeasonalPayoutLedgerValidator {
  return new SeasonalPayoutLedgerValidator(
    [
      new SeasonalPayoutLedgerCodeLengthRule(120),
      new SeasonalPayoutLedgerAllowedChannelRule([]),
      new SeasonalPayoutLedgerRequiredChannelRule("seasonal payout ledger needs an entry"),
    ],
  );
}
