import { AdaptiveTicketViewLedger } from "./adaptive-ticket-view-ledger.js";

/** A rule a adaptive ticket view ledger must pass. Check returns its problems, or none. */
export interface AdaptiveTicketViewLedgerRule {
  check(item: AdaptiveTicketViewLedger): string[];
}

export class AdaptiveTicketViewLedgerUnitLengthRule implements AdaptiveTicketViewLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveTicketViewLedger): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveTicketViewLedgerRequiredVariantRule implements AdaptiveTicketViewLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveTicketViewLedger): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveTicketViewLedgerCodeLengthRule implements AdaptiveTicketViewLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveTicketViewLedger): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveTicketViewLedgerRequiredLabelRule implements AdaptiveTicketViewLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveTicketViewLedger): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a adaptive ticket view ledger. */
export class AdaptiveTicketViewLedgerValidator {
  rules: AdaptiveTicketViewLedgerRule[];

  constructor(rules: AdaptiveTicketViewLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveTicketViewLedger): string[] {
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

  requireValid(item: AdaptiveTicketViewLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveTicketViewLedger[]): Map<string, string[]> {
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

export function defaultAdaptiveTicketViewLedgerValidator(): AdaptiveTicketViewLedgerValidator {
  return new AdaptiveTicketViewLedgerValidator(
    [
      new AdaptiveTicketViewLedgerUnitLengthRule(86400),
      new AdaptiveTicketViewLedgerRequiredVariantRule("adaptive ticket view ledger needs this field"),
      new AdaptiveTicketViewLedgerCodeLengthRule(255),
      new AdaptiveTicketViewLedgerRequiredLabelRule("adaptive ticket view ledger needs a value"),
    ],
  );
}
