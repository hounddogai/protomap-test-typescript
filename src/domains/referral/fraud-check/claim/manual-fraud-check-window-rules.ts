import * as text from "../../../../kit/text.js";
import { ManualFraudCheckWindow } from "./manual-fraud-check-window.js";

/** A rule a manual fraud check window must pass. Check returns its problems, or none. */
export interface ManualFraudCheckWindowRule {
  check(item: ManualFraudCheckWindow): string[];
}

export class ManualFraudCheckWindowRequiredLabelRule implements ManualFraudCheckWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualFraudCheckWindow): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class ManualFraudCheckWindowLabelLengthRule implements ManualFraudCheckWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualFraudCheckWindow): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualFraudCheckWindowBidRangeRule implements ManualFraudCheckWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualFraudCheckWindow): string[] {
    const value = item.bid;
    if (value < this.min || value > this.max) return [`bid ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ManualFraudCheckWindowCodePrefixRule implements ManualFraudCheckWindowRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ManualFraudCheckWindow): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ManualFraudCheckWindowAllowedPhoneRule implements ManualFraudCheckWindowRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ManualFraudCheckWindow): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.phone))) return [`phone ${item.phone} is inconsistent`];
    return [];
  }
}

export class ManualFraudCheckWindowRequiredDescriptionRule implements ManualFraudCheckWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualFraudCheckWindow): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a manual fraud check window. */
export class ManualFraudCheckWindowValidator {
  rules: ManualFraudCheckWindowRule[];

  constructor(rules: ManualFraudCheckWindowRule[]) {
    this.rules = rules;
  }

  validate(item: ManualFraudCheckWindow): string[] {
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

  requireValid(item: ManualFraudCheckWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualFraudCheckWindow[]): Map<string, string[]> {
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

export function defaultManualFraudCheckWindowValidator(): ManualFraudCheckWindowValidator {
  return new ManualFraudCheckWindowValidator(
    [
      new ManualFraudCheckWindowRequiredLabelRule("manual fraud check window needs a value"),
      new ManualFraudCheckWindowLabelLengthRule(255),
      new ManualFraudCheckWindowBidRangeRule(9.9, 1868.4),
      new ManualFraudCheckWindowCodePrefixRule("X"),
      new ManualFraudCheckWindowAllowedPhoneRule(["tiered", "primary", "strict"]),
      new ManualFraudCheckWindowRequiredDescriptionRule("manual fraud check window needs a value"),
    ],
  );
}
