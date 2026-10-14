import { BadgeLedger } from "./badge-ledger.js";

/** A rule a badge ledger must pass. Check returns its problems, or none. */
export interface BadgeLedgerRule {
  check(item: BadgeLedger): string[];
}

export class BadgeLedgerNameLengthRule implements BadgeLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BadgeLedger): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BadgeLedgerRequiredNameRule implements BadgeLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BadgeLedger): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class BadgeLedgerDescriptionLengthRule implements BadgeLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BadgeLedger): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BadgeLedgerCodePrefixRule implements BadgeLedgerRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BadgeLedger): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BadgeLedgerPinnedGuardRule implements BadgeLedgerRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: BadgeLedger): string[] {
    if (item.pinned && item.quantity > this.limit) return [`quantity ${item.quantity} exceeds ${this.limit} while pinned`];
    return [];
  }
}

/** Runs every rule of a badge ledger. */
export class BadgeLedgerValidator {
  rules: BadgeLedgerRule[];

  constructor(rules: BadgeLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: BadgeLedger): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BadgeLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BadgeLedger[]): Map<string, string[]> {
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

export function defaultBadgeLedgerValidator(): BadgeLedgerValidator {
  return new BadgeLedgerValidator(
    [
      new BadgeLedgerNameLengthRule(86400),
      new BadgeLedgerRequiredNameRule("badge ledger needs this field"),
      new BadgeLedgerDescriptionLengthRule(80),
      new BadgeLedgerCodePrefixRule("ACM"),
      new BadgeLedgerPinnedGuardRule(255),
    ],
  );
}
