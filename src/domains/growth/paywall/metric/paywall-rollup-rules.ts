import * as text from "../../../../kit/text.js";
import { PaywallRollup } from "./paywall-rollup.js";

/** A rule a paywall rollup must pass. Check returns its problems, or none. */
export interface PaywallRollupRule {
  check(item: PaywallRollup): string[];
}

export class PaywallRollupFloorValueRangeRule implements PaywallRollupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PaywallRollup): string[] {
    const value = item.floorValue;
    if (value < this.min || value > this.max) return [`floor value ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PaywallRollupCodePrefixRule implements PaywallRollupRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PaywallRollup): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PaywallRollupRequiredJourneyIdRule implements PaywallRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PaywallRollup): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

export class PaywallRollupCodeLengthRule implements PaywallRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PaywallRollup): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PaywallRollupAllowedCodeRule implements PaywallRollupRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PaywallRollup): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is inconsistent`];
    return [];
  }
}

/** Runs every rule of a paywall rollup. */
export class PaywallRollupValidator {
  rules: PaywallRollupRule[];

  constructor(rules: PaywallRollupRule[]) {
    this.rules = rules;
  }

  validate(item: PaywallRollup): string[] {
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

  requireValid(item: PaywallRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PaywallRollup[]): Map<string, string[]> {
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

export function defaultPaywallRollupValidator(): PaywallRollupValidator {
  return new PaywallRollupValidator(
    [
      new PaywallRollupFloorValueRangeRule(0.4, 594.9),
      new PaywallRollupCodePrefixRule("Q"),
      new PaywallRollupRequiredJourneyIdRule("paywall rollup needs this field"),
      new PaywallRollupCodeLengthRule(1000),
      new PaywallRollupAllowedCodeRule(["primary", "legacy", "legacy"]),
    ],
  );
}
