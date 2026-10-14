import * as text from "../../../../kit/text.js";
import { GlobalComplaintLedger } from "./global-complaint-ledger.js";

/** A rule a global complaint ledger must pass. Check returns its problems, or none. */
export interface GlobalComplaintLedgerRule {
  check(item: GlobalComplaintLedger): string[];
}

export class GlobalComplaintLedgerRequiredLabelRule implements GlobalComplaintLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalComplaintLedger): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalComplaintLedgerAllowedExternalRefRule implements GlobalComplaintLedgerRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: GlobalComplaintLedger): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.externalRef))) return [`external ref ${item.externalRef} is out of range`];
    return [];
  }
}

export class GlobalComplaintLedgerExternalRefLengthRule implements GlobalComplaintLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalComplaintLedger): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalComplaintLedgerActiveGuardRule implements GlobalComplaintLedgerRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: GlobalComplaintLedger): string[] {
    if (item.active && item.cost > this.limit) return [`cost ${item.cost} exceeds ${this.limit} while active`];
    return [];
  }
}

/** Runs every rule of a global complaint ledger. */
export class GlobalComplaintLedgerValidator {
  rules: GlobalComplaintLedgerRule[];

  constructor(rules: GlobalComplaintLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalComplaintLedger): string[] {
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

  requireValid(item: GlobalComplaintLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalComplaintLedger[]): Map<string, string[]> {
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

export function defaultGlobalComplaintLedgerValidator(): GlobalComplaintLedgerValidator {
  return new GlobalComplaintLedgerValidator(
    [
      new GlobalComplaintLedgerRequiredLabelRule("global complaint ledger needs this field"),
      new GlobalComplaintLedgerAllowedExternalRefRule([]),
      new GlobalComplaintLedgerExternalRefLengthRule(80),
      new GlobalComplaintLedgerActiveGuardRule(4.9),
    ],
  );
}
