import { LenientCreativeLedger } from "./lenient-creative-ledger.js";

/** A rule a lenient creative ledger must pass. Check returns its problems, or none. */
export interface LenientCreativeLedgerRule {
  check(item: LenientCreativeLedger): string[];
}

export class LenientCreativeLedgerCreatedAtRangeRule implements LenientCreativeLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientCreativeLedger): string[] {
    const value = item.createdAt;
    if (value < this.min || value > this.max) return [`created at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientCreativeLedgerChecksumLengthRule implements LenientCreativeLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientCreativeLedger): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientCreativeLedgerRequiredTitleRule implements LenientCreativeLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientCreativeLedger): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class LenientCreativeLedgerCodeLengthRule implements LenientCreativeLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientCreativeLedger): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientCreativeLedgerCodePrefixRule implements LenientCreativeLedgerRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LenientCreativeLedger): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a lenient creative ledger. */
export class LenientCreativeLedgerValidator {
  rules: LenientCreativeLedgerRule[];

  constructor(rules: LenientCreativeLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: LenientCreativeLedger): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientCreativeLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientCreativeLedger[]): Map<string, string[]> {
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

export function defaultLenientCreativeLedgerValidator(): LenientCreativeLedgerValidator {
  return new LenientCreativeLedgerValidator(
    [
      new LenientCreativeLedgerCreatedAtRangeRule(80, 1000),
      new LenientCreativeLedgerChecksumLengthRule(16),
      new LenientCreativeLedgerRequiredTitleRule("lenient creative ledger needs this field"),
      new LenientCreativeLedgerCodeLengthRule(3600),
      new LenientCreativeLedgerCodePrefixRule("Q"),
    ],
  );
}
