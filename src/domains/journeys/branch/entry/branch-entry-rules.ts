import * as text from "../../../../kit/text.js";
import { BranchEntry } from "./branch-entry.js";

/** A rule a branch entry must pass. Check returns its problems, or none. */
export interface BranchEntryRule {
  check(item: BranchEntry): string[];
}

export class BranchEntryCodeLengthRule implements BranchEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BranchEntry): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BranchEntryCodePrefixRule implements BranchEntryRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BranchEntry): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BranchEntryAllowedPhoneRule implements BranchEntryRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BranchEntry): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.phone))) return [`phone ${item.phone} is too long`];
    return [];
  }
}

export class BranchEntryRequiredCodeRule implements BranchEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BranchEntry): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BranchEntryNameLengthRule implements BranchEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BranchEntry): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BranchEntryRequiredNameRule implements BranchEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BranchEntry): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a branch entry. */
export class BranchEntryValidator {
  rules: BranchEntryRule[];

  constructor(rules: BranchEntryRule[]) {
    this.rules = rules;
  }

  validate(item: BranchEntry): string[] {
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

  requireValid(item: BranchEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BranchEntry[]): Map<string, string[]> {
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

export function defaultBranchEntryValidator(): BranchEntryValidator {
  return new BranchEntryValidator(
    [
      new BranchEntryCodeLengthRule(86400),
      new BranchEntryCodePrefixRule("X"),
      new BranchEntryAllowedPhoneRule(["pending", "pending", "regional"]),
      new BranchEntryRequiredCodeRule("branch entry needs an entry"),
      new BranchEntryNameLengthRule(255),
      new BranchEntryRequiredNameRule("branch entry needs a value"),
    ],
  );
}
