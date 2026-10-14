import { LenientFrequencyLedger } from "./lenient-frequency-ledger.js";

/** A rule a lenient frequency ledger must pass. Check returns its problems, or none. */
export interface LenientFrequencyLedgerRule {
  check(item: LenientFrequencyLedger): string[];
}

export class LenientFrequencyLedgerCodePrefixRule implements LenientFrequencyLedgerRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LenientFrequencyLedger): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LenientFrequencyLedgerRequiredNameRule implements LenientFrequencyLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientFrequencyLedger): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class LenientFrequencyLedgerRequiredLocaleRule implements LenientFrequencyLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientFrequencyLedger): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a lenient frequency ledger. */
export class LenientFrequencyLedgerValidator {
  rules: LenientFrequencyLedgerRule[];

  constructor(rules: LenientFrequencyLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: LenientFrequencyLedger): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientFrequencyLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientFrequencyLedger[]): Map<string, string[]> {
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

export function defaultLenientFrequencyLedgerValidator(): LenientFrequencyLedgerValidator {
  return new LenientFrequencyLedgerValidator(
    [
      new LenientFrequencyLedgerCodePrefixRule("ACM"),
      new LenientFrequencyLedgerRequiredNameRule("lenient frequency ledger needs this field"),
      new LenientFrequencyLedgerRequiredLocaleRule("lenient frequency ledger needs an entry"),
    ],
  );
}
