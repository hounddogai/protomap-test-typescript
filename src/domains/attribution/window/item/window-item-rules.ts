import * as text from "../../../../kit/text.js";
import { WindowItem } from "./window-item.js";

/** A rule a window item must pass. Check returns its problems, or none. */
export interface WindowItemRule {
  check(item: WindowItem): string[];
}

export class WindowItemCodePrefixRule implements WindowItemRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WindowItem): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WindowItemAllowedLabelRule implements WindowItemRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WindowItem): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is missing`];
    return [];
  }
}

export class WindowItemPinnedGuardRule implements WindowItemRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: WindowItem): string[] {
    if (item.pinned && item.startsAt > this.limit) return [`starts at ${item.startsAt} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class WindowItemLabelLengthRule implements WindowItemRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WindowItem): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a window item. */
export class WindowItemValidator {
  rules: WindowItemRule[];

  constructor(rules: WindowItemRule[]) {
    this.rules = rules;
  }

  validate(item: WindowItem): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WindowItem): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WindowItem[]): Map<string, string[]> {
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

export function defaultWindowItemValidator(): WindowItemValidator {
  return new WindowItemValidator(
    [
      new WindowItemCodePrefixRule("REF"),
      new WindowItemAllowedLabelRule(["global", "seasonal"]),
      new WindowItemPinnedGuardRule(120),
      new WindowItemLabelLengthRule(16),
    ],
  );
}
