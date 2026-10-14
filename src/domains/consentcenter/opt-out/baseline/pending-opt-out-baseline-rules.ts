import * as text from "../../../../kit/text.js";
import { PendingOptOutBaseline } from "./pending-opt-out-baseline.js";

/** A rule a pending opt out baseline must pass. Check returns its problems, or none. */
export interface PendingOptOutBaselineRule {
  check(item: PendingOptOutBaseline): string[];
}

export class PendingOptOutBaselineCategoryLengthRule implements PendingOptOutBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingOptOutBaseline): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingOptOutBaselineAllowedDescriptionRule implements PendingOptOutBaselineRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PendingOptOutBaseline): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.description))) return [`description ${item.description} is unknown`];
    return [];
  }
}

export class PendingOptOutBaselineRequiredNameRule implements PendingOptOutBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingOptOutBaseline): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class PendingOptOutBaselineCodePrefixRule implements PendingOptOutBaselineRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PendingOptOutBaseline): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PendingOptOutBaselinePhoneLengthRule implements PendingOptOutBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingOptOutBaseline): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a pending opt out baseline. */
export class PendingOptOutBaselineValidator {
  rules: PendingOptOutBaselineRule[];

  constructor(rules: PendingOptOutBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: PendingOptOutBaseline): string[] {
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

  requireValid(item: PendingOptOutBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingOptOutBaseline[]): Map<string, string[]> {
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

export function defaultPendingOptOutBaselineValidator(): PendingOptOutBaselineValidator {
  return new PendingOptOutBaselineValidator(
    [
      new PendingOptOutBaselineCategoryLengthRule(3600),
      new PendingOptOutBaselineAllowedDescriptionRule(["default"]),
      new PendingOptOutBaselineRequiredNameRule("pending opt out baseline needs an entry"),
      new PendingOptOutBaselineCodePrefixRule("ACM"),
      new PendingOptOutBaselinePhoneLengthRule(80),
    ],
  );
}
