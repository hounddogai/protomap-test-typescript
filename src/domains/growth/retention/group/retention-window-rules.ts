import * as text from "../../../../kit/text.js";
import { RetentionWindow } from "./retention-window.js";

/** A rule a retention window must pass. Check returns its problems, or none. */
export interface RetentionWindowRule {
  check(item: RetentionWindow): string[];
}

export class RetentionWindowAllowedVariantRule implements RetentionWindowRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RetentionWindow): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.variant))) return [`variant ${item.variant} is out of range`];
    return [];
  }
}

export class RetentionWindowCodePrefixRule implements RetentionWindowRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RetentionWindow): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RetentionWindowRequiredVariantRule implements RetentionWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RetentionWindow): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

export class RetentionWindowRequiredCurrencyRule implements RetentionWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RetentionWindow): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

export class RetentionWindowCodeLengthRule implements RetentionWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RetentionWindow): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RetentionWindowLabelLengthRule implements RetentionWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RetentionWindow): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a retention window. */
export class RetentionWindowValidator {
  rules: RetentionWindowRule[];

  constructor(rules: RetentionWindowRule[]) {
    this.rules = rules;
  }

  validate(item: RetentionWindow): string[] {
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

  requireValid(item: RetentionWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RetentionWindow[]): Map<string, string[]> {
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

export function defaultRetentionWindowValidator(): RetentionWindowValidator {
  return new RetentionWindowValidator(
    [
      new RetentionWindowAllowedVariantRule(["manual", "strict", "weighted"]),
      new RetentionWindowCodePrefixRule("X"),
      new RetentionWindowRequiredVariantRule("retention window needs a value"),
      new RetentionWindowRequiredCurrencyRule("retention window needs a value"),
      new RetentionWindowCodeLengthRule(64),
      new RetentionWindowLabelLengthRule(255),
    ],
  );
}
