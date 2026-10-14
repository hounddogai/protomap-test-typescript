import * as text from "../../../../kit/text.js";
import { DoubleOptInEntry } from "./double-opt-in-entry.js";

/** A rule a double opt in entry must pass. Check returns its problems, or none. */
export interface DoubleOptInEntryRule {
  check(item: DoubleOptInEntry): string[];
}

export class DoubleOptInEntryLocaleLengthRule implements DoubleOptInEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DoubleOptInEntry): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DoubleOptInEntryNameLengthRule implements DoubleOptInEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DoubleOptInEntry): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DoubleOptInEntryRequiredNameRule implements DoubleOptInEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DoubleOptInEntry): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class DoubleOptInEntryCodePrefixRule implements DoubleOptInEntryRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DoubleOptInEntry): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class DoubleOptInEntryAllowedCodeRule implements DoubleOptInEntryRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DoubleOptInEntry): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is blocked`];
    return [];
  }
}

export class DoubleOptInEntryRequiredLocaleRule implements DoubleOptInEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DoubleOptInEntry): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a double opt in entry. */
export class DoubleOptInEntryValidator {
  rules: DoubleOptInEntryRule[];

  constructor(rules: DoubleOptInEntryRule[]) {
    this.rules = rules;
  }

  validate(item: DoubleOptInEntry): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DoubleOptInEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DoubleOptInEntry[]): Map<string, string[]> {
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

export function defaultDoubleOptInEntryValidator(): DoubleOptInEntryValidator {
  return new DoubleOptInEntryValidator(
    [
      new DoubleOptInEntryLocaleLengthRule(1000),
      new DoubleOptInEntryNameLengthRule(86400),
      new DoubleOptInEntryRequiredNameRule("double opt in entry needs an entry"),
      new DoubleOptInEntryCodePrefixRule("X"),
      new DoubleOptInEntryAllowedCodeRule([]),
      new DoubleOptInEntryRequiredLocaleRule("double opt in entry needs an entry"),
    ],
  );
}
