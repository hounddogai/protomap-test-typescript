import * as text from "../../../../kit/text.js";
import { GlobalPlacementEntry } from "./global-placement-entry.js";

/** A rule a global placement entry must pass. Check returns its problems, or none. */
export interface GlobalPlacementEntryRule {
  check(item: GlobalPlacementEntry): string[];
}

export class GlobalPlacementEntryRequiredCodeRule implements GlobalPlacementEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalPlacementEntry): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalPlacementEntryGraceDaysRangeRule implements GlobalPlacementEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalPlacementEntry): string[] {
    const value = item.graceDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`grace days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`grace days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class GlobalPlacementEntryAllowedCodeRule implements GlobalPlacementEntryRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: GlobalPlacementEntry): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is too long`];
    return [];
  }
}

export class GlobalPlacementEntryCodeLengthRule implements GlobalPlacementEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalPlacementEntry): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a global placement entry. */
export class GlobalPlacementEntryValidator {
  rules: GlobalPlacementEntryRule[];

  constructor(rules: GlobalPlacementEntryRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalPlacementEntry): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalPlacementEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalPlacementEntry[]): Map<string, string[]> {
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

export function defaultGlobalPlacementEntryValidator(): GlobalPlacementEntryValidator {
  return new GlobalPlacementEntryValidator(
    [
      new GlobalPlacementEntryRequiredCodeRule("global placement entry needs an entry"),
      new GlobalPlacementEntryGraceDaysRangeRule(80, 120),
      new GlobalPlacementEntryAllowedCodeRule([]),
      new GlobalPlacementEntryCodeLengthRule(86400),
    ],
  );
}
