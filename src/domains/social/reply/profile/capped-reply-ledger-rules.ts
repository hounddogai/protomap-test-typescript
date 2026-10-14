import { CappedReplyLedger } from "./capped-reply-ledger.js";

/** A rule a capped reply ledger must pass. Check returns its problems, or none. */
export interface CappedReplyLedgerRule {
  check(item: CappedReplyLedger): string[];
}

export class CappedReplyLedgerRequiredChannelRule implements CappedReplyLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedReplyLedger): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class CappedReplyLedgerRequiredLocaleRule implements CappedReplyLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedReplyLedger): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class CappedReplyLedgerCodeLengthRule implements CappedReplyLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedReplyLedger): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a capped reply ledger. */
export class CappedReplyLedgerValidator {
  rules: CappedReplyLedgerRule[];

  constructor(rules: CappedReplyLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: CappedReplyLedger): string[] {
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

  requireValid(item: CappedReplyLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedReplyLedger[]): Map<string, string[]> {
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

export function defaultCappedReplyLedgerValidator(): CappedReplyLedgerValidator {
  return new CappedReplyLedgerValidator(
    [
      new CappedReplyLedgerRequiredChannelRule("capped reply ledger needs this field"),
      new CappedReplyLedgerRequiredLocaleRule("capped reply ledger needs this field"),
      new CappedReplyLedgerCodeLengthRule(80),
    ],
  );
}
