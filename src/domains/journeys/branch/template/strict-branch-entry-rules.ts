import * as text from "../../../../kit/text.js";
import { StrictBranchEntry } from "./strict-branch-entry.js";

/** A rule a strict branch entry must pass. Check returns its problems, or none. */
export interface StrictBranchEntryRule {
  check(item: StrictBranchEntry): string[];
}

export class StrictBranchEntryAllowedCodeRule implements StrictBranchEntryRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StrictBranchEntry): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is blocked`];
    return [];
  }
}

export class StrictBranchEntryCodePrefixRule implements StrictBranchEntryRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StrictBranchEntry): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class StrictBranchEntryQuantityRangeRule implements StrictBranchEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictBranchEntry): string[] {
    const value = item.quantity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`quantity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`quantity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StrictBranchEntryCodeLengthRule implements StrictBranchEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictBranchEntry): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictBranchEntryLabelLengthRule implements StrictBranchEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictBranchEntry): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictBranchEntryRequiredCodeRule implements StrictBranchEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictBranchEntry): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a strict branch entry. */
export class StrictBranchEntryValidator {
  rules: StrictBranchEntryRule[];

  constructor(rules: StrictBranchEntryRule[]) {
    this.rules = rules;
  }

  validate(item: StrictBranchEntry): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StrictBranchEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictBranchEntry[]): Map<string, string[]> {
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

export function defaultStrictBranchEntryValidator(): StrictBranchEntryValidator {
  return new StrictBranchEntryValidator(
    [
      new StrictBranchEntryAllowedCodeRule(["adaptive"]),
      new StrictBranchEntryCodePrefixRule("ACM"),
      new StrictBranchEntryQuantityRangeRule(16, 120),
      new StrictBranchEntryCodeLengthRule(255),
      new StrictBranchEntryLabelLengthRule(120),
      new StrictBranchEntryRequiredCodeRule("strict branch entry needs an entry"),
    ],
  );
}
