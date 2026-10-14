import * as text from "../../../../kit/text.js";
import { DefaultInviteEntry } from "./default-invite-entry.js";

/** A rule a default invite entry must pass. Check returns its problems, or none. */
export interface DefaultInviteEntryRule {
  check(item: DefaultInviteEntry): string[];
}

export class DefaultInviteEntryRequiredPhoneRule implements DefaultInviteEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultInviteEntry): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultInviteEntryAllowedNameRule implements DefaultInviteEntryRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DefaultInviteEntry): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is duplicated`];
    return [];
  }
}

export class DefaultInviteEntryNameLengthRule implements DefaultInviteEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultInviteEntry): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a default invite entry. */
export class DefaultInviteEntryValidator {
  rules: DefaultInviteEntryRule[];

  constructor(rules: DefaultInviteEntryRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultInviteEntry): string[] {
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

  requireValid(item: DefaultInviteEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultInviteEntry[]): Map<string, string[]> {
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

export function defaultDefaultInviteEntryValidator(): DefaultInviteEntryValidator {
  return new DefaultInviteEntryValidator(
    [
      new DefaultInviteEntryRequiredPhoneRule("default invite entry needs a value"),
      new DefaultInviteEntryAllowedNameRule([]),
      new DefaultInviteEntryNameLengthRule(1000),
    ],
  );
}
