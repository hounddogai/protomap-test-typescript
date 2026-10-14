import { PayoutAssignment } from "./payout-assignment.js";

/** A rule a payout assignment must pass. Check returns its problems, or none. */
export interface PayoutAssignmentRule {
  check(item: PayoutAssignment): string[];
}

export class PayoutAssignmentLabelLengthRule implements PayoutAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PayoutAssignment): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PayoutAssignmentAttemptsRangeRule implements PayoutAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PayoutAssignment): string[] {
    const value = item.attempts;
    if (value < this.min || value > this.max) return [`attempts ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PayoutAssignmentCodePrefixRule implements PayoutAssignmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PayoutAssignment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PayoutAssignmentRequiredLabelRule implements PayoutAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PayoutAssignment): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class PayoutAssignmentConversionRateRangeRule implements PayoutAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PayoutAssignment): string[] {
    const value = item.conversionRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`conversion rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`conversion rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a payout assignment. */
export class PayoutAssignmentValidator {
  rules: PayoutAssignmentRule[];

  constructor(rules: PayoutAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: PayoutAssignment): string[] {
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

  requireValid(item: PayoutAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PayoutAssignment[]): Map<string, string[]> {
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

export function defaultPayoutAssignmentValidator(): PayoutAssignmentValidator {
  return new PayoutAssignmentValidator(
    [
      new PayoutAssignmentLabelLengthRule(3600),
      new PayoutAssignmentAttemptsRangeRule(64, 120),
      new PayoutAssignmentCodePrefixRule("ACM"),
      new PayoutAssignmentRequiredLabelRule("payout assignment needs a value"),
      new PayoutAssignmentConversionRateRangeRule(9.7, 1012.7),
    ],
  );
}
