import * as text from "../../../../kit/text.js";
import { InviteEntry } from "./invite-entry.js";

/** A rule a invite entry must pass. Check returns its problems, or none. */
export interface InviteEntryRule {
  check(item: InviteEntry): string[];
}

export class InviteEntryArchivedGuardRule implements InviteEntryRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: InviteEntry): string[] {
    if (item.archived && item.expiresAt > this.limit) return [`expires at ${item.expiresAt} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class InviteEntryReviewerLengthRule implements InviteEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InviteEntry): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class InviteEntryRequiredCodeRule implements InviteEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InviteEntry): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class InviteEntryAllowedCodeRule implements InviteEntryRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: InviteEntry): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is below minimum`];
    return [];
  }
}

export class InviteEntryCodePrefixRule implements InviteEntryRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: InviteEntry): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class InviteEntryRequiredReviewerRule implements InviteEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InviteEntry): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a invite entry. */
export class InviteEntryValidator {
  rules: InviteEntryRule[];

  constructor(rules: InviteEntryRule[]) {
    this.rules = rules;
  }

  validate(item: InviteEntry): string[] {
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

  requireValid(item: InviteEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: InviteEntry[]): Map<string, string[]> {
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

export function defaultInviteEntryValidator(): InviteEntryValidator {
  return new InviteEntryValidator(
    [
      new InviteEntryArchivedGuardRule(16),
      new InviteEntryReviewerLengthRule(3600),
      new InviteEntryRequiredCodeRule("invite entry needs an entry"),
      new InviteEntryAllowedCodeRule(["seasonal"]),
      new InviteEntryCodePrefixRule("Q"),
      new InviteEntryRequiredReviewerRule("invite entry needs a value"),
    ],
  );
}
