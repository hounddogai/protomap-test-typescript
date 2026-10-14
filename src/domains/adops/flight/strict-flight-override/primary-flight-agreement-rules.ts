import { PrimaryFlightAgreement } from "./primary-flight-agreement.js";

/** A rule a primary flight agreement must pass. Check returns its problems, or none. */
export interface PrimaryFlightAgreementRule {
  check(item: PrimaryFlightAgreement): string[];
}

export class PrimaryFlightAgreementWeightRangeRule implements PrimaryFlightAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryFlightAgreement): string[] {
    const value = item.weight;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`weight ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`weight ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PrimaryFlightAgreementExternalRefLengthRule implements PrimaryFlightAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryFlightAgreement): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryFlightAgreementRequiredLocaleRule implements PrimaryFlightAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryFlightAgreement): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryFlightAgreementRequiredCodeRule implements PrimaryFlightAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryFlightAgreement): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a primary flight agreement. */
export class PrimaryFlightAgreementValidator {
  rules: PrimaryFlightAgreementRule[];

  constructor(rules: PrimaryFlightAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryFlightAgreement): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryFlightAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryFlightAgreement[]): Map<string, string[]> {
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

export function defaultPrimaryFlightAgreementValidator(): PrimaryFlightAgreementValidator {
  return new PrimaryFlightAgreementValidator(
    [
      new PrimaryFlightAgreementWeightRangeRule(9.3, 3822.5),
      new PrimaryFlightAgreementExternalRefLengthRule(16),
      new PrimaryFlightAgreementRequiredLocaleRule("primary flight agreement needs an entry"),
      new PrimaryFlightAgreementRequiredCodeRule("primary flight agreement needs a value"),
    ],
  );
}
