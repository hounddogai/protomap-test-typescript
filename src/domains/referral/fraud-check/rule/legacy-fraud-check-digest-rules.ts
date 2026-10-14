import { LegacyFraudCheckDigest } from "./legacy-fraud-check-digest.js";

/** A rule a legacy fraud check digest must pass. Check returns its problems, or none. */
export interface LegacyFraudCheckDigestRule {
  check(item: LegacyFraudCheckDigest): string[];
}

export class LegacyFraudCheckDigestRequiredCodeRule implements LegacyFraudCheckDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyFraudCheckDigest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyFraudCheckDigestNameLengthRule implements LegacyFraudCheckDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyFraudCheckDigest): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyFraudCheckDigestBudgetRangeRule implements LegacyFraudCheckDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyFraudCheckDigest): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LegacyFraudCheckDigestOwnerIdLengthRule implements LegacyFraudCheckDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyFraudCheckDigest): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a legacy fraud check digest. */
export class LegacyFraudCheckDigestValidator {
  rules: LegacyFraudCheckDigestRule[];

  constructor(rules: LegacyFraudCheckDigestRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyFraudCheckDigest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacyFraudCheckDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyFraudCheckDigest[]): Map<string, string[]> {
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

export function defaultLegacyFraudCheckDigestValidator(): LegacyFraudCheckDigestValidator {
  return new LegacyFraudCheckDigestValidator(
    [
      new LegacyFraudCheckDigestRequiredCodeRule("legacy fraud check digest needs a value"),
      new LegacyFraudCheckDigestNameLengthRule(80),
      new LegacyFraudCheckDigestBudgetRangeRule(1.2, 3089.7),
      new LegacyFraudCheckDigestOwnerIdLengthRule(32),
    ],
  );
}
