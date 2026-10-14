import { PrimaryFraudCheckClaim } from "./primary-fraud-check-claim.js";

/** A rule a primary fraud check claim must pass. Check returns its problems, or none. */
export interface PrimaryFraudCheckClaimRule {
  check(item: PrimaryFraudCheckClaim): string[];
}

export class PrimaryFraudCheckClaimLabelLengthRule implements PrimaryFraudCheckClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryFraudCheckClaim): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryFraudCheckClaimRequiredLabelRule implements PrimaryFraudCheckClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryFraudCheckClaim): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryFraudCheckClaimNameLengthRule implements PrimaryFraudCheckClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryFraudCheckClaim): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryFraudCheckClaimCodeLengthRule implements PrimaryFraudCheckClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryFraudCheckClaim): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a primary fraud check claim. */
export class PrimaryFraudCheckClaimValidator {
  rules: PrimaryFraudCheckClaimRule[];

  constructor(rules: PrimaryFraudCheckClaimRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryFraudCheckClaim): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryFraudCheckClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryFraudCheckClaim[]): Map<string, string[]> {
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

export function defaultPrimaryFraudCheckClaimValidator(): PrimaryFraudCheckClaimValidator {
  return new PrimaryFraudCheckClaimValidator(
    [
      new PrimaryFraudCheckClaimLabelLengthRule(32),
      new PrimaryFraudCheckClaimRequiredLabelRule("primary fraud check claim needs this field"),
      new PrimaryFraudCheckClaimNameLengthRule(80),
      new PrimaryFraudCheckClaimCodeLengthRule(255),
    ],
  );
}
