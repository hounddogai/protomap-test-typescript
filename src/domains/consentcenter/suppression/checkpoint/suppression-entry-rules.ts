import * as text from "../../../../kit/text.js";
import { SuppressionEntry } from "./suppression-entry.js";

/** A rule a suppression entry must pass. Check returns its problems, or none. */
export interface SuppressionEntryRule {
  check(item: SuppressionEntry): string[];
}

export class SuppressionEntryRequiredTitleRule implements SuppressionEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SuppressionEntry): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class SuppressionEntryCodeLengthRule implements SuppressionEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SuppressionEntry): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SuppressionEntryRequiredCodeRule implements SuppressionEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SuppressionEntry): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class SuppressionEntryArchivedGuardRule implements SuppressionEntryRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: SuppressionEntry): string[] {
    if (item.archived && item.quantity > this.limit) return [`quantity ${item.quantity} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class SuppressionEntryAllowedCodeRule implements SuppressionEntryRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SuppressionEntry): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is blocked`];
    return [];
  }
}

/** Runs every rule of a suppression entry. */
export class SuppressionEntryValidator {
  rules: SuppressionEntryRule[];

  constructor(rules: SuppressionEntryRule[]) {
    this.rules = rules;
  }

  validate(item: SuppressionEntry): string[] {
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

  requireValid(item: SuppressionEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SuppressionEntry[]): Map<string, string[]> {
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

export function defaultSuppressionEntryValidator(): SuppressionEntryValidator {
  return new SuppressionEntryValidator(
    [
      new SuppressionEntryRequiredTitleRule("suppression entry needs this field"),
      new SuppressionEntryCodeLengthRule(32),
      new SuppressionEntryRequiredCodeRule("suppression entry needs this field"),
      new SuppressionEntryArchivedGuardRule(120),
      new SuppressionEntryAllowedCodeRule(["pending"]),
    ],
  );
}
