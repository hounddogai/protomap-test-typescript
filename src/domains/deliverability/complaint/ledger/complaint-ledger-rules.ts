import { ComplaintLedger } from "./complaint-ledger.js";

/** A rule a complaint ledger must pass. Check returns its problems, or none. */
export interface ComplaintLedgerRule {
  check(item: ComplaintLedger): string[];
}

export class ComplaintLedgerCodeLengthRule implements ComplaintLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ComplaintLedger): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ComplaintLedgerCodePrefixRule implements ComplaintLedgerRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ComplaintLedger): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ComplaintLedgerReviewerLengthRule implements ComplaintLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ComplaintLedger): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ComplaintLedgerLocaleLengthRule implements ComplaintLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ComplaintLedger): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ComplaintLedgerVersionRangeRule implements ComplaintLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ComplaintLedger): string[] {
    const value = item.version;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`version ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`version ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a complaint ledger. */
export class ComplaintLedgerValidator {
  rules: ComplaintLedgerRule[];

  constructor(rules: ComplaintLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: ComplaintLedger): string[] {
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

  requireValid(item: ComplaintLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ComplaintLedger[]): Map<string, string[]> {
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

export function defaultComplaintLedgerValidator(): ComplaintLedgerValidator {
  return new ComplaintLedgerValidator(
    [
      new ComplaintLedgerCodeLengthRule(1000),
      new ComplaintLedgerCodePrefixRule("ACM"),
      new ComplaintLedgerReviewerLengthRule(32),
      new ComplaintLedgerLocaleLengthRule(86400),
      new ComplaintLedgerVersionRangeRule(32, 255),
    ],
  );
}
