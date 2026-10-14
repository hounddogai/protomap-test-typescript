import * as text from "../../../../kit/text.js";
import { OptOutBaseline } from "./opt-out-baseline.js";

/** A rule a opt out baseline must pass. Check returns its problems, or none. */
export interface OptOutBaselineRule {
  check(item: OptOutBaseline): string[];
}

export class OptOutBaselineCodeLengthRule implements OptOutBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: OptOutBaseline): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class OptOutBaselineCodePrefixRule implements OptOutBaselineRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: OptOutBaseline): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class OptOutBaselineAllowedCountryRule implements OptOutBaselineRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: OptOutBaseline): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.country))) return [`country ${item.country} is out of range`];
    return [];
  }
}

export class OptOutBaselineRequiredCodeRule implements OptOutBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: OptOutBaseline): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class OptOutBaselineAmountRangeRule implements OptOutBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: OptOutBaseline): string[] {
    const value = item.amount;
    if (value < this.min || value > this.max) return [`amount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class OptOutBaselineRequiredNameRule implements OptOutBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: OptOutBaseline): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a opt out baseline. */
export class OptOutBaselineValidator {
  rules: OptOutBaselineRule[];

  constructor(rules: OptOutBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: OptOutBaseline): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: OptOutBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: OptOutBaseline[]): Map<string, string[]> {
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

export function defaultOptOutBaselineValidator(): OptOutBaselineValidator {
  return new OptOutBaselineValidator(
    [
      new OptOutBaselineCodeLengthRule(32),
      new OptOutBaselineCodePrefixRule("ACM"),
      new OptOutBaselineAllowedCountryRule(["default"]),
      new OptOutBaselineRequiredCodeRule("opt out baseline needs this field"),
      new OptOutBaselineAmountRangeRule(3.4, 4437.1),
      new OptOutBaselineRequiredNameRule("opt out baseline needs a value"),
    ],
  );
}
