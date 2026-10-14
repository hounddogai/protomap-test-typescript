import * as text from "../../../../kit/text.js";
import { CreativeLedger } from "./creative-ledger.js";

/** A rule a creative ledger must pass. Check returns its problems, or none. */
export interface CreativeLedgerRule {
  check(item: CreativeLedger): string[];
}

export class CreativeLedgerCodeLengthRule implements CreativeLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreativeLedger): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreativeLedgerRequiredDescriptionRule implements CreativeLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreativeLedger): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

export class CreativeLedgerDescriptionLengthRule implements CreativeLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreativeLedger): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreativeLedgerAllowedDescriptionRule implements CreativeLedgerRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CreativeLedger): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.description))) return [`description ${item.description} is above maximum`];
    return [];
  }
}

export class CreativeLedgerTitleLengthRule implements CreativeLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreativeLedger): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreativeLedgerDurationMinutesRangeRule implements CreativeLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreativeLedger): string[] {
    const value = item.durationMinutes;
    if (value < this.min || value > this.max) return [`duration minutes ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a creative ledger. */
export class CreativeLedgerValidator {
  rules: CreativeLedgerRule[];

  constructor(rules: CreativeLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: CreativeLedger): string[] {
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

  requireValid(item: CreativeLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CreativeLedger[]): Map<string, string[]> {
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

export function defaultCreativeLedgerValidator(): CreativeLedgerValidator {
  return new CreativeLedgerValidator(
    [
      new CreativeLedgerCodeLengthRule(32),
      new CreativeLedgerRequiredDescriptionRule("creative ledger needs an entry"),
      new CreativeLedgerDescriptionLengthRule(120),
      new CreativeLedgerAllowedDescriptionRule([]),
      new CreativeLedgerTitleLengthRule(16),
      new CreativeLedgerDurationMinutesRangeRule(16, 80),
    ],
  );
}
