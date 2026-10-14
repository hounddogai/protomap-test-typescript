import { AdaptiveComplaintLedger } from "./adaptive-complaint-ledger.js";

/** A rule a adaptive complaint ledger must pass. Check returns its problems, or none. */
export interface AdaptiveComplaintLedgerRule {
  check(item: AdaptiveComplaintLedger): string[];
}

export class AdaptiveComplaintLedgerRequiredTitleRule implements AdaptiveComplaintLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveComplaintLedger): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveComplaintLedgerRequiredDescriptionRule implements AdaptiveComplaintLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveComplaintLedger): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveComplaintLedgerDescriptionLengthRule implements AdaptiveComplaintLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveComplaintLedger): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveComplaintLedgerRequiredCodeRule implements AdaptiveComplaintLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveComplaintLedger): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a adaptive complaint ledger. */
export class AdaptiveComplaintLedgerValidator {
  rules: AdaptiveComplaintLedgerRule[];

  constructor(rules: AdaptiveComplaintLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveComplaintLedger): string[] {
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

  requireValid(item: AdaptiveComplaintLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveComplaintLedger[]): Map<string, string[]> {
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

export function defaultAdaptiveComplaintLedgerValidator(): AdaptiveComplaintLedgerValidator {
  return new AdaptiveComplaintLedgerValidator(
    [
      new AdaptiveComplaintLedgerRequiredTitleRule("adaptive complaint ledger needs this field"),
      new AdaptiveComplaintLedgerRequiredDescriptionRule("adaptive complaint ledger needs an entry"),
      new AdaptiveComplaintLedgerDescriptionLengthRule(16),
      new AdaptiveComplaintLedgerRequiredCodeRule("adaptive complaint ledger needs this field"),
    ],
  );
}
