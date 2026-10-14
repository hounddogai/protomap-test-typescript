import * as text from "../../../../kit/text.js";
import { OptOutWindow } from "./opt-out-window.js";

/** A rule a opt out window must pass. Check returns its problems, or none. */
export interface OptOutWindowRule {
  check(item: OptOutWindow): string[];
}

export class OptOutWindowAllowedTitleRule implements OptOutWindowRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: OptOutWindow): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is not allowed`];
    return [];
  }
}

export class OptOutWindowCodePrefixRule implements OptOutWindowRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: OptOutWindow): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class OptOutWindowRequiredNotesRule implements OptOutWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: OptOutWindow): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a opt out window. */
export class OptOutWindowValidator {
  rules: OptOutWindowRule[];

  constructor(rules: OptOutWindowRule[]) {
    this.rules = rules;
  }

  validate(item: OptOutWindow): string[] {
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

  requireValid(item: OptOutWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: OptOutWindow[]): Map<string, string[]> {
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

export function defaultOptOutWindowValidator(): OptOutWindowValidator {
  return new OptOutWindowValidator(
    [
      new OptOutWindowAllowedTitleRule(["seasonal", "fallback"]),
      new OptOutWindowCodePrefixRule("X"),
      new OptOutWindowRequiredNotesRule("opt out window needs this field"),
    ],
  );
}
