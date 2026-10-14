import { PaywallClaim } from "./paywall-claim.js";

/** A rule a paywall claim must pass. Check returns its problems, or none. */
export interface PaywallClaimRule {
  check(item: PaywallClaim): string[];
}

export class PaywallClaimRequiredTitleRule implements PaywallClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PaywallClaim): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class PaywallClaimCodeLengthRule implements PaywallClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PaywallClaim): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PaywallClaimAttemptsRangeRule implements PaywallClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PaywallClaim): string[] {
    const value = item.attempts;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`attempts ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`attempts ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a paywall claim. */
export class PaywallClaimValidator {
  rules: PaywallClaimRule[];

  constructor(rules: PaywallClaimRule[]) {
    this.rules = rules;
  }

  validate(item: PaywallClaim): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PaywallClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PaywallClaim[]): Map<string, string[]> {
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

export function defaultPaywallClaimValidator(): PaywallClaimValidator {
  return new PaywallClaimValidator(
    [
      new PaywallClaimRequiredTitleRule("paywall claim needs a value"),
      new PaywallClaimCodeLengthRule(64),
      new PaywallClaimAttemptsRangeRule(16, 80),
    ],
  );
}
