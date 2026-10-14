import { PaywallBaseline } from "./paywall-baseline.js";

/** A rule a paywall baseline must pass. Check returns its problems, or none. */
export interface PaywallBaselineRule {
  check(item: PaywallBaseline): string[];
}

export class PaywallBaselineCodePrefixRule implements PaywallBaselineRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PaywallBaseline): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PaywallBaselineLabelLengthRule implements PaywallBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PaywallBaseline): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PaywallBaselineCodeLengthRule implements PaywallBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PaywallBaseline): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PaywallBaselineRequiredCodeRule implements PaywallBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PaywallBaseline): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a paywall baseline. */
export class PaywallBaselineValidator {
  rules: PaywallBaselineRule[];

  constructor(rules: PaywallBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: PaywallBaseline): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PaywallBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PaywallBaseline[]): Map<string, string[]> {
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

export function defaultPaywallBaselineValidator(): PaywallBaselineValidator {
  return new PaywallBaselineValidator(
    [
      new PaywallBaselineCodePrefixRule("ACM"),
      new PaywallBaselineLabelLengthRule(16),
      new PaywallBaselineCodeLengthRule(86400),
      new PaywallBaselineRequiredCodeRule("paywall baseline needs an entry"),
    ],
  );
}
