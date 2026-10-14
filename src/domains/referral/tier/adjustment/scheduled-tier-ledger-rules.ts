import { ScheduledTierLedger } from "./scheduled-tier-ledger.js";

/** A rule a scheduled tier ledger must pass. Check returns its problems, or none. */
export interface ScheduledTierLedgerRule {
  check(item: ScheduledTierLedger): string[];
}

export class ScheduledTierLedgerNameLengthRule implements ScheduledTierLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledTierLedger): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledTierLedgerRequiredNameRule implements ScheduledTierLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledTierLedger): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledTierLedgerRequiredCampaignRefRule implements ScheduledTierLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledTierLedger): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledTierLedgerCampaignRefLengthRule implements ScheduledTierLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledTierLedger): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledTierLedgerCodePrefixRule implements ScheduledTierLedgerRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ScheduledTierLedger): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a scheduled tier ledger. */
export class ScheduledTierLedgerValidator {
  rules: ScheduledTierLedgerRule[];

  constructor(rules: ScheduledTierLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledTierLedger): string[] {
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

  requireValid(item: ScheduledTierLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledTierLedger[]): Map<string, string[]> {
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

export function defaultScheduledTierLedgerValidator(): ScheduledTierLedgerValidator {
  return new ScheduledTierLedgerValidator(
    [
      new ScheduledTierLedgerNameLengthRule(86400),
      new ScheduledTierLedgerRequiredNameRule("scheduled tier ledger needs an entry"),
      new ScheduledTierLedgerRequiredCampaignRefRule("scheduled tier ledger needs this field"),
      new ScheduledTierLedgerCampaignRefLengthRule(120),
      new ScheduledTierLedgerCodePrefixRule("ACM"),
    ],
  );
}
