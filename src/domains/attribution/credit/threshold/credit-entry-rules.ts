import * as text from "../../../../kit/text.js";
import { CreditEntry } from "./credit-entry.js";

/** A rule a credit entry must pass. Check returns its problems, or none. */
export interface CreditEntryRule {
  check(item: CreditEntry): string[];
}

export class CreditEntryLabelLengthRule implements CreditEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreditEntry): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreditEntryCodePrefixRule implements CreditEntryRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CreditEntry): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CreditEntryRequiredOwnerIdRule implements CreditEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreditEntry): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class CreditEntryAttemptsRangeRule implements CreditEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreditEntry): string[] {
    const value = item.attempts;
    if (value < this.min || value > this.max) return [`attempts ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CreditEntryAllowedCodeRule implements CreditEntryRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CreditEntry): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is expired`];
    return [];
  }
}

/** Runs every rule of a credit entry. */
export class CreditEntryValidator {
  rules: CreditEntryRule[];

  constructor(rules: CreditEntryRule[]) {
    this.rules = rules;
  }

  validate(item: CreditEntry): string[] {
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

  requireValid(item: CreditEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CreditEntry[]): Map<string, string[]> {
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

export function defaultCreditEntryValidator(): CreditEntryValidator {
  return new CreditEntryValidator(
    [
      new CreditEntryLabelLengthRule(1000),
      new CreditEntryCodePrefixRule("X"),
      new CreditEntryRequiredOwnerIdRule("credit entry needs an entry"),
      new CreditEntryAttemptsRangeRule(64, 3600),
      new CreditEntryAllowedCodeRule([]),
    ],
  );
}
