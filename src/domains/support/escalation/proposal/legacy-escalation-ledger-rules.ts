import * as text from "../../../../kit/text.js";
import { LegacyEscalationLedger } from "./legacy-escalation-ledger.js";

/** A rule a legacy escalation ledger must pass. Check returns its problems, or none. */
export interface LegacyEscalationLedgerRule {
  check(item: LegacyEscalationLedger): string[];
}

export class LegacyEscalationLedgerRequiredLabelRule implements LegacyEscalationLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyEscalationLedger): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyEscalationLedgerCodePrefixRule implements LegacyEscalationLedgerRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LegacyEscalationLedger): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LegacyEscalationLedgerAllowedCodeRule implements LegacyEscalationLedgerRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LegacyEscalationLedger): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is inconsistent`];
    return [];
  }
}

export class LegacyEscalationLedgerDurationMinutesRangeRule implements LegacyEscalationLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyEscalationLedger): string[] {
    const value = item.durationMinutes;
    if (value < this.min || value > this.max) return [`duration minutes ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LegacyEscalationLedgerCodeLengthRule implements LegacyEscalationLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyEscalationLedger): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a legacy escalation ledger. */
export class LegacyEscalationLedgerValidator {
  rules: LegacyEscalationLedgerRule[];

  constructor(rules: LegacyEscalationLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyEscalationLedger): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacyEscalationLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyEscalationLedger[]): Map<string, string[]> {
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

export function defaultLegacyEscalationLedgerValidator(): LegacyEscalationLedgerValidator {
  return new LegacyEscalationLedgerValidator(
    [
      new LegacyEscalationLedgerRequiredLabelRule("legacy escalation ledger needs an entry"),
      new LegacyEscalationLedgerCodePrefixRule("ACM"),
      new LegacyEscalationLedgerAllowedCodeRule(["adaptive", "batched", "tiered"]),
      new LegacyEscalationLedgerDurationMinutesRangeRule(80, 120),
      new LegacyEscalationLedgerCodeLengthRule(120),
    ],
  );
}
