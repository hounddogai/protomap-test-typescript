import * as text from "../../../../kit/text.js";
import { RegionalDoubleOptInEntry } from "./regional-double-opt-in-entry.js";

/** A rule a regional double opt in entry must pass. Check returns its problems, or none. */
export interface RegionalDoubleOptInEntryRule {
  check(item: RegionalDoubleOptInEntry): string[];
}

export class RegionalDoubleOptInEntryCodePrefixRule implements RegionalDoubleOptInEntryRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RegionalDoubleOptInEntry): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RegionalDoubleOptInEntryAllowedDescriptionRule implements RegionalDoubleOptInEntryRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RegionalDoubleOptInEntry): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.description))) return [`description ${item.description} is too long`];
    return [];
  }
}

export class RegionalDoubleOptInEntryCodeLengthRule implements RegionalDoubleOptInEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalDoubleOptInEntry): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalDoubleOptInEntryRequiredLabelRule implements RegionalDoubleOptInEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalDoubleOptInEntry): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalDoubleOptInEntryRequiredCodeRule implements RegionalDoubleOptInEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalDoubleOptInEntry): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalDoubleOptInEntryDescriptionLengthRule implements RegionalDoubleOptInEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalDoubleOptInEntry): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a regional double opt in entry. */
export class RegionalDoubleOptInEntryValidator {
  rules: RegionalDoubleOptInEntryRule[];

  constructor(rules: RegionalDoubleOptInEntryRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalDoubleOptInEntry): string[] {
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

  requireValid(item: RegionalDoubleOptInEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalDoubleOptInEntry[]): Map<string, string[]> {
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

export function defaultRegionalDoubleOptInEntryValidator(): RegionalDoubleOptInEntryValidator {
  return new RegionalDoubleOptInEntryValidator(
    [
      new RegionalDoubleOptInEntryCodePrefixRule("X"),
      new RegionalDoubleOptInEntryAllowedDescriptionRule([]),
      new RegionalDoubleOptInEntryCodeLengthRule(86400),
      new RegionalDoubleOptInEntryRequiredLabelRule("regional double opt in entry needs this field"),
      new RegionalDoubleOptInEntryRequiredCodeRule("regional double opt in entry needs an entry"),
      new RegionalDoubleOptInEntryDescriptionLengthRule(64),
    ],
  );
}
