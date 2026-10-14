import { PaywallRule } from "./paywall-rule.js";

/** A rule a paywall rule must pass. Check returns its problems, or none. */
export interface PaywallRuleRule {
  check(item: PaywallRule): string[];
}

export class PaywallRuleRequiredTimezoneRule implements PaywallRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PaywallRule): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class PaywallRuleSourceLengthRule implements PaywallRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PaywallRule): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PaywallRuleCodeLengthRule implements PaywallRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PaywallRule): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PaywallRuleRequiredTitleRule implements PaywallRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PaywallRule): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a paywall rule. */
export class PaywallRuleValidator {
  rules: PaywallRuleRule[];

  constructor(rules: PaywallRuleRule[]) {
    this.rules = rules;
  }

  validate(item: PaywallRule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PaywallRule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PaywallRule[]): Map<string, string[]> {
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

export function defaultPaywallRuleValidator(): PaywallRuleValidator {
  return new PaywallRuleValidator(
    [
      new PaywallRuleRequiredTimezoneRule("paywall rule needs a value"),
      new PaywallRuleSourceLengthRule(64),
      new PaywallRuleCodeLengthRule(64),
      new PaywallRuleRequiredTitleRule("paywall rule needs this field"),
    ],
  );
}
