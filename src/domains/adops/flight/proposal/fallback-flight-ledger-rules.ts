import { FallbackFlightLedger } from "./fallback-flight-ledger.js";

/** A rule a fallback flight ledger must pass. Check returns its problems, or none. */
export interface FallbackFlightLedgerRule {
  check(item: FallbackFlightLedger): string[];
}

export class FallbackFlightLedgerCodeLengthRule implements FallbackFlightLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackFlightLedger): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackFlightLedgerActiveGuardRule implements FallbackFlightLedgerRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: FallbackFlightLedger): string[] {
    if (item.active && item.limit > this.limit) return [`limit ${item.limit} exceeds ${this.limit} while active`];
    return [];
  }
}

export class FallbackFlightLedgerRequiredTitleRule implements FallbackFlightLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackFlightLedger): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackFlightLedgerCodePrefixRule implements FallbackFlightLedgerRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FallbackFlightLedger): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FallbackFlightLedgerVersionRangeRule implements FallbackFlightLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackFlightLedger): string[] {
    const value = item.version;
    if (value < this.min || value > this.max) return [`version ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a fallback flight ledger. */
export class FallbackFlightLedgerValidator {
  rules: FallbackFlightLedgerRule[];

  constructor(rules: FallbackFlightLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackFlightLedger): string[] {
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

  requireValid(item: FallbackFlightLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackFlightLedger[]): Map<string, string[]> {
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

export function defaultFallbackFlightLedgerValidator(): FallbackFlightLedgerValidator {
  return new FallbackFlightLedgerValidator(
    [
      new FallbackFlightLedgerCodeLengthRule(64),
      new FallbackFlightLedgerActiveGuardRule(1000),
      new FallbackFlightLedgerRequiredTitleRule("fallback flight ledger needs a value"),
      new FallbackFlightLedgerCodePrefixRule("ACM"),
      new FallbackFlightLedgerVersionRangeRule(64, 86400),
    ],
  );
}
