import { PaywallAssignment } from "./paywall-assignment.js";

/** A rule a paywall assignment must pass. Check returns its problems, or none. */
export interface PaywallAssignmentRule {
  check(item: PaywallAssignment): string[];
}

export class PaywallAssignmentVariantLengthRule implements PaywallAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PaywallAssignment): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PaywallAssignmentCountryLengthRule implements PaywallAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PaywallAssignment): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PaywallAssignmentUpdatedAtRangeRule implements PaywallAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PaywallAssignment): string[] {
    const value = item.updatedAt;
    if (value < this.min || value > this.max) return [`updated at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PaywallAssignmentRequiredCountryRule implements PaywallAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PaywallAssignment): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class PaywallAssignmentCodeLengthRule implements PaywallAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PaywallAssignment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a paywall assignment. */
export class PaywallAssignmentValidator {
  rules: PaywallAssignmentRule[];

  constructor(rules: PaywallAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: PaywallAssignment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PaywallAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PaywallAssignment[]): Map<string, string[]> {
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

export function defaultPaywallAssignmentValidator(): PaywallAssignmentValidator {
  return new PaywallAssignmentValidator(
    [
      new PaywallAssignmentVariantLengthRule(32),
      new PaywallAssignmentCountryLengthRule(3600),
      new PaywallAssignmentUpdatedAtRangeRule(16, 32),
      new PaywallAssignmentRequiredCountryRule("paywall assignment needs a value"),
      new PaywallAssignmentCodeLengthRule(16),
    ],
  );
}
