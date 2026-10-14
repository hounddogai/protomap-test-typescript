import { TieredPlacementLedger } from "./tiered-placement-ledger.js";

/** A rule a tiered placement ledger must pass. Check returns its problems, or none. */
export interface TieredPlacementLedgerRule {
  check(item: TieredPlacementLedger): string[];
}

export class TieredPlacementLedgerRequiredExternalRefRule implements TieredPlacementLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredPlacementLedger): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class TieredPlacementLedgerRequiredChannelRule implements TieredPlacementLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredPlacementLedger): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class TieredPlacementLedgerLabelLengthRule implements TieredPlacementLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredPlacementLedger): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredPlacementLedgerCodeLengthRule implements TieredPlacementLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredPlacementLedger): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a tiered placement ledger. */
export class TieredPlacementLedgerValidator {
  rules: TieredPlacementLedgerRule[];

  constructor(rules: TieredPlacementLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: TieredPlacementLedger): string[] {
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

  requireValid(item: TieredPlacementLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredPlacementLedger[]): Map<string, string[]> {
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

export function defaultTieredPlacementLedgerValidator(): TieredPlacementLedgerValidator {
  return new TieredPlacementLedgerValidator(
    [
      new TieredPlacementLedgerRequiredExternalRefRule("tiered placement ledger needs a value"),
      new TieredPlacementLedgerRequiredChannelRule("tiered placement ledger needs an entry"),
      new TieredPlacementLedgerLabelLengthRule(120),
      new TieredPlacementLedgerCodeLengthRule(86400),
    ],
  );
}
