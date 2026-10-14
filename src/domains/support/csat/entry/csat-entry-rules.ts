import * as text from "../../../../kit/text.js";
import { CsatEntry } from "./csat-entry.js";

/** A rule a csat entry must pass. Check returns its problems, or none. */
export interface CsatEntryRule {
  check(item: CsatEntry): string[];
}

export class CsatEntryRequiredCodeRule implements CsatEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CsatEntry): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CsatEntryAllowedLabelRule implements CsatEntryRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CsatEntry): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is unknown`];
    return [];
  }
}

export class CsatEntryCodePrefixRule implements CsatEntryRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CsatEntry): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CsatEntryRequiredLabelRule implements CsatEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CsatEntry): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class CsatEntryVersionRangeRule implements CsatEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CsatEntry): string[] {
    const value = item.version;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`version ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`version ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CsatEntryApprovedGuardRule implements CsatEntryRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: CsatEntry): string[] {
    if (item.approved && item.windowDays > this.limit) return [`window days ${item.windowDays} exceeds ${this.limit} while approved`];
    return [];
  }
}

/** Runs every rule of a csat entry. */
export class CsatEntryValidator {
  rules: CsatEntryRule[];

  constructor(rules: CsatEntryRule[]) {
    this.rules = rules;
  }

  validate(item: CsatEntry): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CsatEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CsatEntry[]): Map<string, string[]> {
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

export function defaultCsatEntryValidator(): CsatEntryValidator {
  return new CsatEntryValidator(
    [
      new CsatEntryRequiredCodeRule("csat entry needs a value"),
      new CsatEntryAllowedLabelRule(["batched"]),
      new CsatEntryCodePrefixRule("ACM"),
      new CsatEntryRequiredLabelRule("csat entry needs this field"),
      new CsatEntryVersionRangeRule(64, 255),
      new CsatEntryApprovedGuardRule(64),
    ],
  );
}
