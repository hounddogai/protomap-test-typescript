import * as text from "../../../../kit/text.js";
import { CreditOverride } from "./credit-override.js";

/** A rule a credit override must pass. Check returns its problems, or none. */
export interface CreditOverrideRule {
  check(item: CreditOverride): string[];
}

export class CreditOverrideAllowedLabelRule implements CreditOverrideRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CreditOverride): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is expired`];
    return [];
  }
}

export class CreditOverrideLocaleLengthRule implements CreditOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreditOverride): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreditOverrideSendAtRangeRule implements CreditOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreditOverride): string[] {
    const value = item.sendAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`send at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`send at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CreditOverrideRequiredNameRule implements CreditOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreditOverride): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class CreditOverrideRequiredPhoneRule implements CreditOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreditOverride): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class CreditOverrideNameLengthRule implements CreditOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreditOverride): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a credit override. */
export class CreditOverrideValidator {
  rules: CreditOverrideRule[];

  constructor(rules: CreditOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: CreditOverride): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CreditOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CreditOverride[]): Map<string, string[]> {
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

export function defaultCreditOverrideValidator(): CreditOverrideValidator {
  return new CreditOverrideValidator(
    [
      new CreditOverrideAllowedLabelRule(["global"]),
      new CreditOverrideLocaleLengthRule(1000),
      new CreditOverrideSendAtRangeRule(80, 86400),
      new CreditOverrideRequiredNameRule("credit override needs a value"),
      new CreditOverrideRequiredPhoneRule("credit override needs this field"),
      new CreditOverrideNameLengthRule(86400),
    ],
  );
}
