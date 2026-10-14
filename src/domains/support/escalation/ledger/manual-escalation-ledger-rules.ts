import * as text from "../../../../kit/text.js";
import { ManualEscalationLedger } from "./manual-escalation-ledger.js";

/** A rule a manual escalation ledger must pass. Check returns its problems, or none. */
export interface ManualEscalationLedgerRule {
  check(item: ManualEscalationLedger): string[];
}

export class ManualEscalationLedgerWindowDaysRangeRule implements ManualEscalationLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualEscalationLedger): string[] {
    const value = item.windowDays;
    if (value < this.min || value > this.max) return [`window days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ManualEscalationLedgerRequiredCategoryRule implements ManualEscalationLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualEscalationLedger): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

export class ManualEscalationLedgerLabelLengthRule implements ManualEscalationLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualEscalationLedger): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualEscalationLedgerClicksRangeRule implements ManualEscalationLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualEscalationLedger): string[] {
    const value = item.clicks;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`clicks ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`clicks ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ManualEscalationLedgerAllowedLabelRule implements ManualEscalationLedgerRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ManualEscalationLedger): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is unknown`];
    return [];
  }
}

/** Runs every rule of a manual escalation ledger. */
export class ManualEscalationLedgerValidator {
  rules: ManualEscalationLedgerRule[];

  constructor(rules: ManualEscalationLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: ManualEscalationLedger): string[] {
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

  requireValid(item: ManualEscalationLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualEscalationLedger[]): Map<string, string[]> {
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

export function defaultManualEscalationLedgerValidator(): ManualEscalationLedgerValidator {
  return new ManualEscalationLedgerValidator(
    [
      new ManualEscalationLedgerWindowDaysRangeRule(120, 3600),
      new ManualEscalationLedgerRequiredCategoryRule("manual escalation ledger needs an entry"),
      new ManualEscalationLedgerLabelLengthRule(32),
      new ManualEscalationLedgerClicksRangeRule(120, 3600),
      new ManualEscalationLedgerAllowedLabelRule([]),
    ],
  );
}
