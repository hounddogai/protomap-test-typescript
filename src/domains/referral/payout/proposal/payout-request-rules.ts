import { PayoutRequest } from "./payout-request.js";

/** A rule a payout request must pass. Check returns its problems, or none. */
export interface PayoutRequestRule {
  check(item: PayoutRequest): string[];
}

export class PayoutRequestCurrencyLengthRule implements PayoutRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PayoutRequest): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PayoutRequestRequiredCurrencyRule implements PayoutRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PayoutRequest): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

export class PayoutRequestNameLengthRule implements PayoutRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PayoutRequest): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a payout request. */
export class PayoutRequestValidator {
  rules: PayoutRequestRule[];

  constructor(rules: PayoutRequestRule[]) {
    this.rules = rules;
  }

  validate(item: PayoutRequest): string[] {
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

  requireValid(item: PayoutRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PayoutRequest[]): Map<string, string[]> {
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

export function defaultPayoutRequestValidator(): PayoutRequestValidator {
  return new PayoutRequestValidator(
    [
      new PayoutRequestCurrencyLengthRule(1000),
      new PayoutRequestRequiredCurrencyRule("payout request needs this field"),
      new PayoutRequestNameLengthRule(120),
    ],
  );
}
