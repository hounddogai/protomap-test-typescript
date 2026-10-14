import { SeasonalReputationLedger } from "./seasonal-reputation-ledger.js";

/** A rule a seasonal reputation ledger must pass. Check returns its problems, or none. */
export interface SeasonalReputationLedgerRule {
  check(item: SeasonalReputationLedger): string[];
}

export class SeasonalReputationLedgerAudienceIdLengthRule implements SeasonalReputationLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalReputationLedger): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalReputationLedgerTitleLengthRule implements SeasonalReputationLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalReputationLedger): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalReputationLedgerLabelLengthRule implements SeasonalReputationLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalReputationLedger): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalReputationLedgerRequiredCodeRule implements SeasonalReputationLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalReputationLedger): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalReputationLedgerRequiredAudienceIdRule implements SeasonalReputationLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalReputationLedger): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a seasonal reputation ledger. */
export class SeasonalReputationLedgerValidator {
  rules: SeasonalReputationLedgerRule[];

  constructor(rules: SeasonalReputationLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalReputationLedger): string[] {
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

  requireValid(item: SeasonalReputationLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalReputationLedger[]): Map<string, string[]> {
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

export function defaultSeasonalReputationLedgerValidator(): SeasonalReputationLedgerValidator {
  return new SeasonalReputationLedgerValidator(
    [
      new SeasonalReputationLedgerAudienceIdLengthRule(1000),
      new SeasonalReputationLedgerTitleLengthRule(80),
      new SeasonalReputationLedgerLabelLengthRule(3600),
      new SeasonalReputationLedgerRequiredCodeRule("seasonal reputation ledger needs a value"),
      new SeasonalReputationLedgerRequiredAudienceIdRule("seasonal reputation ledger needs a value"),
    ],
  );
}
