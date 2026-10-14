import { EscalationLedger } from "./escalation-ledger.js";

/** A rule a escalation ledger must pass. Check returns its problems, or none. */
export interface EscalationLedgerRule {
  check(item: EscalationLedger): string[];
}

export class EscalationLedgerCohortLengthRule implements EscalationLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EscalationLedger): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class EscalationLedgerCodeLengthRule implements EscalationLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EscalationLedger): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class EscalationLedgerApprovedGuardRule implements EscalationLedgerRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: EscalationLedger): string[] {
    if (item.approved && item.openRate > this.limit) return [`open rate ${item.openRate} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class EscalationLedgerRequiredCurrencyRule implements EscalationLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EscalationLedger): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a escalation ledger. */
export class EscalationLedgerValidator {
  rules: EscalationLedgerRule[];

  constructor(rules: EscalationLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: EscalationLedger): string[] {
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

  requireValid(item: EscalationLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: EscalationLedger[]): Map<string, string[]> {
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

export function defaultEscalationLedgerValidator(): EscalationLedgerValidator {
  return new EscalationLedgerValidator(
    [
      new EscalationLedgerCohortLengthRule(3600),
      new EscalationLedgerCodeLengthRule(86400),
      new EscalationLedgerApprovedGuardRule(2.1),
      new EscalationLedgerRequiredCurrencyRule("escalation ledger needs an entry"),
    ],
  );
}
