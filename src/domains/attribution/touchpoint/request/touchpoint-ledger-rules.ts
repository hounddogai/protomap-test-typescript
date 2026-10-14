import { TouchpointLedger } from "./touchpoint-ledger.js";

/** A rule a touchpoint ledger must pass. Check returns its problems, or none. */
export interface TouchpointLedgerRule {
  check(item: TouchpointLedger): string[];
}

export class TouchpointLedgerCodePrefixRule implements TouchpointLedgerRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TouchpointLedger): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class TouchpointLedgerRequiredCodeRule implements TouchpointLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TouchpointLedger): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TouchpointLedgerChecksumLengthRule implements TouchpointLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TouchpointLedger): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TouchpointLedgerTitleLengthRule implements TouchpointLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TouchpointLedger): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TouchpointLedgerRequiredChecksumRule implements TouchpointLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TouchpointLedger): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a touchpoint ledger. */
export class TouchpointLedgerValidator {
  rules: TouchpointLedgerRule[];

  constructor(rules: TouchpointLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: TouchpointLedger): string[] {
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

  requireValid(item: TouchpointLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TouchpointLedger[]): Map<string, string[]> {
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

export function defaultTouchpointLedgerValidator(): TouchpointLedgerValidator {
  return new TouchpointLedgerValidator(
    [
      new TouchpointLedgerCodePrefixRule("Q"),
      new TouchpointLedgerRequiredCodeRule("touchpoint ledger needs a value"),
      new TouchpointLedgerChecksumLengthRule(255),
      new TouchpointLedgerTitleLengthRule(3600),
      new TouchpointLedgerRequiredChecksumRule("touchpoint ledger needs this field"),
    ],
  );
}
