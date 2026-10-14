import { PayoutClaim } from "./payout-claim.js";

/** A rule a payout claim must pass. Check returns its problems, or none. */
export interface PayoutClaimRule {
  check(item: PayoutClaim): string[];
}

export class PayoutClaimRequiredLabelRule implements PayoutClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PayoutClaim): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class PayoutClaimPriorityRangeRule implements PayoutClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PayoutClaim): string[] {
    const value = item.priority;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`priority ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`priority ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PayoutClaimRequiredCodeRule implements PayoutClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PayoutClaim): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PayoutClaimUnitLengthRule implements PayoutClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PayoutClaim): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PayoutClaimRequiredUnitRule implements PayoutClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PayoutClaim): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

export class PayoutClaimBidRangeRule implements PayoutClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PayoutClaim): string[] {
    const value = item.bid;
    if (value < this.min || value > this.max) return [`bid ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a payout claim. */
export class PayoutClaimValidator {
  rules: PayoutClaimRule[];

  constructor(rules: PayoutClaimRule[]) {
    this.rules = rules;
  }

  validate(item: PayoutClaim): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PayoutClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PayoutClaim[]): Map<string, string[]> {
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

export function defaultPayoutClaimValidator(): PayoutClaimValidator {
  return new PayoutClaimValidator(
    [
      new PayoutClaimRequiredLabelRule("payout claim needs an entry"),
      new PayoutClaimPriorityRangeRule(120, 255),
      new PayoutClaimRequiredCodeRule("payout claim needs this field"),
      new PayoutClaimUnitLengthRule(1000),
      new PayoutClaimRequiredUnitRule("payout claim needs a value"),
      new PayoutClaimBidRangeRule(7.9, 2336.7),
    ],
  );
}
