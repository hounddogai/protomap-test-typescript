import * as text from "../../../../kit/text.js";
import { StreakEntry } from "./streak-entry.js";

/** A rule a streak entry must pass. Check returns its problems, or none. */
export interface StreakEntryRule {
  check(item: StreakEntry): string[];
}

export class StreakEntryArchivedGuardRule implements StreakEntryRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: StreakEntry): string[] {
    if (item.archived && item.openRate > this.limit) return [`open rate ${item.openRate} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class StreakEntryRequiredCodeRule implements StreakEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StreakEntry): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class StreakEntryLabelLengthRule implements StreakEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StreakEntry): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StreakEntryAllowedChecksumRule implements StreakEntryRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StreakEntry): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.checksum))) return [`checksum ${item.checksum} is inconsistent`];
    return [];
  }
}

/** Runs every rule of a streak entry. */
export class StreakEntryValidator {
  rules: StreakEntryRule[];

  constructor(rules: StreakEntryRule[]) {
    this.rules = rules;
  }

  validate(item: StreakEntry): string[] {
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

  requireValid(item: StreakEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StreakEntry[]): Map<string, string[]> {
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

export function defaultStreakEntryValidator(): StreakEntryValidator {
  return new StreakEntryValidator(
    [
      new StreakEntryArchivedGuardRule(1.2),
      new StreakEntryRequiredCodeRule("streak entry needs an entry"),
      new StreakEntryLabelLengthRule(80),
      new StreakEntryAllowedChecksumRule(["batched", "manual"]),
    ],
  );
}
