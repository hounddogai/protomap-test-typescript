import { LegacyFraudCheckClaim } from "./legacy-fraud-check-claim.js";

/** A rule a legacy fraud check claim must pass. Check returns its problems, or none. */
export interface LegacyFraudCheckClaimRule {
  check(item: LegacyFraudCheckClaim): string[];
}

export class LegacyFraudCheckClaimRequiredLabelRule implements LegacyFraudCheckClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyFraudCheckClaim): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyFraudCheckClaimCodeLengthRule implements LegacyFraudCheckClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyFraudCheckClaim): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyFraudCheckClaimQuantityRangeRule implements LegacyFraudCheckClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyFraudCheckClaim): string[] {
    const value = item.quantity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`quantity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`quantity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a legacy fraud check claim. */
export class LegacyFraudCheckClaimValidator {
  rules: LegacyFraudCheckClaimRule[];

  constructor(rules: LegacyFraudCheckClaimRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyFraudCheckClaim): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacyFraudCheckClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyFraudCheckClaim[]): Map<string, string[]> {
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

export function defaultLegacyFraudCheckClaimValidator(): LegacyFraudCheckClaimValidator {
  return new LegacyFraudCheckClaimValidator(
    [
      new LegacyFraudCheckClaimRequiredLabelRule("legacy fraud check claim needs this field"),
      new LegacyFraudCheckClaimCodeLengthRule(16),
      new LegacyFraudCheckClaimQuantityRangeRule(255, 86400),
    ],
  );
}
