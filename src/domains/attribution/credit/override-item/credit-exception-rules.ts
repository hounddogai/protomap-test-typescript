import { CreditException } from "./credit-exception.js";

/** A rule a credit exception must pass. Check returns its problems, or none. */
export interface CreditExceptionRule {
  check(item: CreditException): string[];
}

export class CreditExceptionCodeLengthRule implements CreditExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreditException): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreditExceptionChecksumLengthRule implements CreditExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreditException): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreditExceptionRequiredVariantRule implements CreditExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreditException): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

export class CreditExceptionRequiredChecksumRule implements CreditExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreditException): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

export class CreditExceptionVariantLengthRule implements CreditExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreditException): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreditExceptionWindowDaysRangeRule implements CreditExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreditException): string[] {
    const value = item.windowDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`window days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`window days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a credit exception. */
export class CreditExceptionValidator {
  rules: CreditExceptionRule[];

  constructor(rules: CreditExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: CreditException): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CreditException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CreditException[]): Map<string, string[]> {
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

export function defaultCreditExceptionValidator(): CreditExceptionValidator {
  return new CreditExceptionValidator(
    [
      new CreditExceptionCodeLengthRule(16),
      new CreditExceptionChecksumLengthRule(255),
      new CreditExceptionRequiredVariantRule("credit exception needs an entry"),
      new CreditExceptionRequiredChecksumRule("credit exception needs an entry"),
      new CreditExceptionVariantLengthRule(255),
      new CreditExceptionWindowDaysRangeRule(32, 80),
    ],
  );
}
