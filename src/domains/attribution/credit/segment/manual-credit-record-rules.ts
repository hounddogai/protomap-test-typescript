import * as text from "../../../../kit/text.js";
import { ManualCreditRecord } from "./manual-credit-record.js";

/** A rule a manual credit record must pass. Check returns its problems, or none. */
export interface ManualCreditRecordRule {
  check(item: ManualCreditRecord): string[];
}

export class ManualCreditRecordAllowedCodeRule implements ManualCreditRecordRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ManualCreditRecord): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is blocked`];
    return [];
  }
}

export class ManualCreditRecordRequiredCodeRule implements ManualCreditRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualCreditRecord): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ManualCreditRecordRequiredContactEmailRule implements ManualCreditRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualCreditRecord): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

export class ManualCreditRecordRequiredCohortRule implements ManualCreditRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualCreditRecord): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

export class ManualCreditRecordRequiredNameRule implements ManualCreditRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualCreditRecord): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a manual credit record. */
export class ManualCreditRecordValidator {
  rules: ManualCreditRecordRule[];

  constructor(rules: ManualCreditRecordRule[]) {
    this.rules = rules;
  }

  validate(item: ManualCreditRecord): string[] {
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

  requireValid(item: ManualCreditRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualCreditRecord[]): Map<string, string[]> {
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

export function defaultManualCreditRecordValidator(): ManualCreditRecordValidator {
  return new ManualCreditRecordValidator(
    [
      new ManualCreditRecordAllowedCodeRule(["strict", "adaptive", "default"]),
      new ManualCreditRecordRequiredCodeRule("manual credit record needs this field"),
      new ManualCreditRecordRequiredContactEmailRule("manual credit record needs an entry"),
      new ManualCreditRecordRequiredCohortRule("manual credit record needs a value"),
      new ManualCreditRecordRequiredNameRule("manual credit record needs this field"),
    ],
  );
}
