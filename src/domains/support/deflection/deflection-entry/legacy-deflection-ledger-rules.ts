import * as text from "../../../../kit/text.js";
import { LegacyDeflectionLedger } from "./legacy-deflection-ledger.js";

/** A rule a legacy deflection ledger must pass. Check returns its problems, or none. */
export interface LegacyDeflectionLedgerRule {
  check(item: LegacyDeflectionLedger): string[];
}

export class LegacyDeflectionLedgerLabelLengthRule implements LegacyDeflectionLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyDeflectionLedger): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyDeflectionLedgerAllowedLabelRule implements LegacyDeflectionLedgerRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LegacyDeflectionLedger): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is stale`];
    return [];
  }
}

export class LegacyDeflectionLedgerRequiredCodeRule implements LegacyDeflectionLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyDeflectionLedger): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyDeflectionLedgerTitleLengthRule implements LegacyDeflectionLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyDeflectionLedger): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyDeflectionLedgerCodePrefixRule implements LegacyDeflectionLedgerRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LegacyDeflectionLedger): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LegacyDeflectionLedgerCodeLengthRule implements LegacyDeflectionLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyDeflectionLedger): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a legacy deflection ledger. */
export class LegacyDeflectionLedgerValidator {
  rules: LegacyDeflectionLedgerRule[];

  constructor(rules: LegacyDeflectionLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyDeflectionLedger): string[] {
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

  requireValid(item: LegacyDeflectionLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyDeflectionLedger[]): Map<string, string[]> {
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

export function defaultLegacyDeflectionLedgerValidator(): LegacyDeflectionLedgerValidator {
  return new LegacyDeflectionLedgerValidator(
    [
      new LegacyDeflectionLedgerLabelLengthRule(32),
      new LegacyDeflectionLedgerAllowedLabelRule(["seasonal", "fallback"]),
      new LegacyDeflectionLedgerRequiredCodeRule("legacy deflection ledger needs a value"),
      new LegacyDeflectionLedgerTitleLengthRule(255),
      new LegacyDeflectionLedgerCodePrefixRule("Q"),
      new LegacyDeflectionLedgerCodeLengthRule(16),
    ],
  );
}
