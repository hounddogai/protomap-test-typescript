import * as text from "../../../../kit/text.js";
import { CreditWindow } from "./credit-window.js";

/** A rule a credit window must pass. Check returns its problems, or none. */
export interface CreditWindowRule {
  check(item: CreditWindow): string[];
}

export class CreditWindowCodePrefixRule implements CreditWindowRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CreditWindow): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CreditWindowTitleLengthRule implements CreditWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreditWindow): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreditWindowRequiredTitleRule implements CreditWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreditWindow): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class CreditWindowBudgetRangeRule implements CreditWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreditWindow): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CreditWindowCodeLengthRule implements CreditWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreditWindow): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreditWindowAllowedCodeRule implements CreditWindowRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CreditWindow): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is too long`];
    return [];
  }
}

/** Runs every rule of a credit window. */
export class CreditWindowValidator {
  rules: CreditWindowRule[];

  constructor(rules: CreditWindowRule[]) {
    this.rules = rules;
  }

  validate(item: CreditWindow): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CreditWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CreditWindow[]): Map<string, string[]> {
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

export function defaultCreditWindowValidator(): CreditWindowValidator {
  return new CreditWindowValidator(
    [
      new CreditWindowCodePrefixRule("OPS"),
      new CreditWindowTitleLengthRule(80),
      new CreditWindowRequiredTitleRule("credit window needs a value"),
      new CreditWindowBudgetRangeRule(2.5, 3888.8),
      new CreditWindowCodeLengthRule(32),
      new CreditWindowAllowedCodeRule(["primary"]),
    ],
  );
}
