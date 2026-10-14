import { PlacementLedger } from "./placement-ledger.js";

/** A rule a placement ledger must pass. Check returns its problems, or none. */
export interface PlacementLedgerRule {
  check(item: PlacementLedger): string[];
}

export class PlacementLedgerRequiredCodeRule implements PlacementLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PlacementLedger): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PlacementLedgerNameLengthRule implements PlacementLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PlacementLedger): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PlacementLedgerRequiredVariantRule implements PlacementLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PlacementLedger): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a placement ledger. */
export class PlacementLedgerValidator {
  rules: PlacementLedgerRule[];

  constructor(rules: PlacementLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: PlacementLedger): string[] {
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

  requireValid(item: PlacementLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PlacementLedger[]): Map<string, string[]> {
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

export function defaultPlacementLedgerValidator(): PlacementLedgerValidator {
  return new PlacementLedgerValidator(
    [
      new PlacementLedgerRequiredCodeRule("placement ledger needs a value"),
      new PlacementLedgerNameLengthRule(3600),
      new PlacementLedgerRequiredVariantRule("placement ledger needs an entry"),
    ],
  );
}
