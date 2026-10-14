import * as text from "../../../../kit/text.js";
import { MacroSnapshot } from "./macro-snapshot.js";

/** A rule a macro snapshot must pass. Check returns its problems, or none. */
export interface MacroSnapshotRule {
  check(item: MacroSnapshot): string[];
}

export class MacroSnapshotOwnerIdLengthRule implements MacroSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MacroSnapshot): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class MacroSnapshotRequiredTitleRule implements MacroSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: MacroSnapshot): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class MacroSnapshotAllowedCodeRule implements MacroSnapshotRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: MacroSnapshot): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is duplicated`];
    return [];
  }
}

/** Runs every rule of a macro snapshot. */
export class MacroSnapshotValidator {
  rules: MacroSnapshotRule[];

  constructor(rules: MacroSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: MacroSnapshot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: MacroSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: MacroSnapshot[]): Map<string, string[]> {
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

export function defaultMacroSnapshotValidator(): MacroSnapshotValidator {
  return new MacroSnapshotValidator(
    [
      new MacroSnapshotOwnerIdLengthRule(16),
      new MacroSnapshotRequiredTitleRule("macro snapshot needs a value"),
      new MacroSnapshotAllowedCodeRule(["rolling", "manual", "rolling"]),
    ],
  );
}
