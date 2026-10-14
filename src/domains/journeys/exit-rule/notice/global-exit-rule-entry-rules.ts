import * as text from "../../../../kit/text.js";
import { GlobalExitRuleEntry } from "./global-exit-rule-entry.js";

/** A rule a global exit rule entry must pass. Check returns its problems, or none. */
export interface GlobalExitRuleEntryRule {
  check(item: GlobalExitRuleEntry): string[];
}

export class GlobalExitRuleEntryCodeLengthRule implements GlobalExitRuleEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalExitRuleEntry): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalExitRuleEntryRequiredLabelRule implements GlobalExitRuleEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalExitRuleEntry): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalExitRuleEntryAllowedCodeRule implements GlobalExitRuleEntryRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: GlobalExitRuleEntry): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is below minimum`];
    return [];
  }
}

export class GlobalExitRuleEntryOpenRateRangeRule implements GlobalExitRuleEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalExitRuleEntry): string[] {
    const value = item.openRate;
    if (value < this.min || value > this.max) return [`open rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class GlobalExitRuleEntryLabelLengthRule implements GlobalExitRuleEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalExitRuleEntry): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalExitRuleEntryCodePrefixRule implements GlobalExitRuleEntryRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: GlobalExitRuleEntry): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a global exit rule entry. */
export class GlobalExitRuleEntryValidator {
  rules: GlobalExitRuleEntryRule[];

  constructor(rules: GlobalExitRuleEntryRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalExitRuleEntry): string[] {
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

  requireValid(item: GlobalExitRuleEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalExitRuleEntry[]): Map<string, string[]> {
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

export function defaultGlobalExitRuleEntryValidator(): GlobalExitRuleEntryValidator {
  return new GlobalExitRuleEntryValidator(
    [
      new GlobalExitRuleEntryCodeLengthRule(32),
      new GlobalExitRuleEntryRequiredLabelRule("global exit rule entry needs an entry"),
      new GlobalExitRuleEntryAllowedCodeRule(["primary", "tiered", "legacy"]),
      new GlobalExitRuleEntryOpenRateRangeRule(8.4, 4787),
      new GlobalExitRuleEntryLabelLengthRule(1000),
      new GlobalExitRuleEntryCodePrefixRule("OPS"),
    ],
  );
}
