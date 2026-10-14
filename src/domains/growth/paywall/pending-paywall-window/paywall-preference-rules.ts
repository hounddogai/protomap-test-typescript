import * as text from "../../../../kit/text.js";
import { PaywallPreference } from "./paywall-preference.js";

/** A rule a paywall preference must pass. Check returns its problems, or none. */
export interface PaywallPreferenceRule {
  check(item: PaywallPreference): string[];
}

export class PaywallPreferenceRequiredUnitRule implements PaywallPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PaywallPreference): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

export class PaywallPreferenceCodePrefixRule implements PaywallPreferenceRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PaywallPreference): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PaywallPreferenceCodeLengthRule implements PaywallPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PaywallPreference): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PaywallPreferenceAllowedCodeRule implements PaywallPreferenceRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PaywallPreference): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is too long`];
    return [];
  }
}

export class PaywallPreferenceUnitLengthRule implements PaywallPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PaywallPreference): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a paywall preference. */
export class PaywallPreferenceValidator {
  rules: PaywallPreferenceRule[];

  constructor(rules: PaywallPreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: PaywallPreference): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PaywallPreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PaywallPreference[]): Map<string, string[]> {
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

export function defaultPaywallPreferenceValidator(): PaywallPreferenceValidator {
  return new PaywallPreferenceValidator(
    [
      new PaywallPreferenceRequiredUnitRule("paywall preference needs this field"),
      new PaywallPreferenceCodePrefixRule("OPS"),
      new PaywallPreferenceCodeLengthRule(64),
      new PaywallPreferenceAllowedCodeRule(["fallback"]),
      new PaywallPreferenceUnitLengthRule(32),
    ],
  );
}
