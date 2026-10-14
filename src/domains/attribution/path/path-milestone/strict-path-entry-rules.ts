import * as text from "../../../../kit/text.js";
import { StrictPathEntry } from "./strict-path-entry.js";

/** A rule a strict path entry must pass. Check returns its problems, or none. */
export interface StrictPathEntryRule {
  check(item: StrictPathEntry): string[];
}

export class StrictPathEntryAllowedCodeRule implements StrictPathEntryRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StrictPathEntry): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is out of range`];
    return [];
  }
}

export class StrictPathEntryCodePrefixRule implements StrictPathEntryRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StrictPathEntry): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class StrictPathEntryUpdatedAtRangeRule implements StrictPathEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictPathEntry): string[] {
    const value = item.updatedAt;
    if (value < this.min || value > this.max) return [`updated at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StrictPathEntryTitleLengthRule implements StrictPathEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictPathEntry): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictPathEntryArchivedGuardRule implements StrictPathEntryRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: StrictPathEntry): string[] {
    if (item.archived && item.threshold > this.limit) return [`threshold ${item.threshold} exceeds ${this.limit} while archived`];
    return [];
  }
}

/** Runs every rule of a strict path entry. */
export class StrictPathEntryValidator {
  rules: StrictPathEntryRule[];

  constructor(rules: StrictPathEntryRule[]) {
    this.rules = rules;
  }

  validate(item: StrictPathEntry): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StrictPathEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictPathEntry[]): Map<string, string[]> {
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

export function defaultStrictPathEntryValidator(): StrictPathEntryValidator {
  return new StrictPathEntryValidator(
    [
      new StrictPathEntryAllowedCodeRule(["default"]),
      new StrictPathEntryCodePrefixRule("ACM"),
      new StrictPathEntryUpdatedAtRangeRule(1000, 86400),
      new StrictPathEntryTitleLengthRule(32),
      new StrictPathEntryArchivedGuardRule(2.5),
    ],
  );
}
