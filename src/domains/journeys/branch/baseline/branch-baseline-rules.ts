import * as text from "../../../../kit/text.js";
import { BranchBaseline } from "./branch-baseline.js";

/** A rule a branch baseline must pass. Check returns its problems, or none. */
export interface BranchBaselineRule {
  check(item: BranchBaseline): string[];
}

export class BranchBaselineRequiredTitleRule implements BranchBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BranchBaseline): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class BranchBaselineAllowedTitleRule implements BranchBaselineRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BranchBaseline): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is too long`];
    return [];
  }
}

export class BranchBaselineCodePrefixRule implements BranchBaselineRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BranchBaseline): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BranchBaselineCodeLengthRule implements BranchBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BranchBaseline): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BranchBaselineTitleLengthRule implements BranchBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BranchBaseline): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a branch baseline. */
export class BranchBaselineValidator {
  rules: BranchBaselineRule[];

  constructor(rules: BranchBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: BranchBaseline): string[] {
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

  requireValid(item: BranchBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BranchBaseline[]): Map<string, string[]> {
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

export function defaultBranchBaselineValidator(): BranchBaselineValidator {
  return new BranchBaselineValidator(
    [
      new BranchBaselineRequiredTitleRule("branch baseline needs this field"),
      new BranchBaselineAllowedTitleRule([]),
      new BranchBaselineCodePrefixRule("REF"),
      new BranchBaselineCodeLengthRule(64),
      new BranchBaselineTitleLengthRule(64),
    ],
  );
}
