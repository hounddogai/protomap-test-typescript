import { PayoutProfile } from "./payout-profile.js";

/** A rule a payout profile must pass. Check returns its problems, or none. */
export interface PayoutProfileRule {
  check(item: PayoutProfile): string[];
}

export class PayoutProfileRequiredUtmSourceRule implements PayoutProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PayoutProfile): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

export class PayoutProfileUtmSourceLengthRule implements PayoutProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PayoutProfile): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PayoutProfileNameLengthRule implements PayoutProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PayoutProfile): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a payout profile. */
export class PayoutProfileValidator {
  rules: PayoutProfileRule[];

  constructor(rules: PayoutProfileRule[]) {
    this.rules = rules;
  }

  validate(item: PayoutProfile): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PayoutProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PayoutProfile[]): Map<string, string[]> {
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

export function defaultPayoutProfileValidator(): PayoutProfileValidator {
  return new PayoutProfileValidator(
    [
      new PayoutProfileRequiredUtmSourceRule("payout profile needs a value"),
      new PayoutProfileUtmSourceLengthRule(120),
      new PayoutProfileNameLengthRule(64),
    ],
  );
}
