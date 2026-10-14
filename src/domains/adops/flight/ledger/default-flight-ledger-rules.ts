import { DefaultFlightLedger } from "./default-flight-ledger.js";

/** A rule a default flight ledger must pass. Check returns its problems, or none. */
export interface DefaultFlightLedgerRule {
  check(item: DefaultFlightLedger): string[];
}

export class DefaultFlightLedgerLabelLengthRule implements DefaultFlightLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultFlightLedger): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultFlightLedgerTitleLengthRule implements DefaultFlightLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultFlightLedger): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultFlightLedgerCodePrefixRule implements DefaultFlightLedgerRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DefaultFlightLedger): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class DefaultFlightLedgerRequiredLabelRule implements DefaultFlightLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultFlightLedger): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultFlightLedgerRequiredCodeRule implements DefaultFlightLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultFlightLedger): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a default flight ledger. */
export class DefaultFlightLedgerValidator {
  rules: DefaultFlightLedgerRule[];

  constructor(rules: DefaultFlightLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultFlightLedger): string[] {
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

  requireValid(item: DefaultFlightLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultFlightLedger[]): Map<string, string[]> {
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

export function defaultDefaultFlightLedgerValidator(): DefaultFlightLedgerValidator {
  return new DefaultFlightLedgerValidator(
    [
      new DefaultFlightLedgerLabelLengthRule(16),
      new DefaultFlightLedgerTitleLengthRule(16),
      new DefaultFlightLedgerCodePrefixRule("ACM"),
      new DefaultFlightLedgerRequiredLabelRule("default flight ledger needs this field"),
      new DefaultFlightLedgerRequiredCodeRule("default flight ledger needs an entry"),
    ],
  );
}
