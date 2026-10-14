import { FraudCheckException } from "./fraud-check-exception.js";

/** A rule a fraud check exception must pass. Check returns its problems, or none. */
export interface FraudCheckExceptionRule {
  check(item: FraudCheckException): string[];
}

export class FraudCheckExceptionCurrencyLengthRule implements FraudCheckExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FraudCheckException): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FraudCheckExceptionCodePrefixRule implements FraudCheckExceptionRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FraudCheckException): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FraudCheckExceptionCreatedAtRangeRule implements FraudCheckExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FraudCheckException): string[] {
    const value = item.createdAt;
    if (value < this.min || value > this.max) return [`created at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FraudCheckExceptionTitleLengthRule implements FraudCheckExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FraudCheckException): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FraudCheckExceptionCodeLengthRule implements FraudCheckExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FraudCheckException): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FraudCheckExceptionRequiredSourceRule implements FraudCheckExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FraudCheckException): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a fraud check exception. */
export class FraudCheckExceptionValidator {
  rules: FraudCheckExceptionRule[];

  constructor(rules: FraudCheckExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: FraudCheckException): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FraudCheckException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FraudCheckException[]): Map<string, string[]> {
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

export function defaultFraudCheckExceptionValidator(): FraudCheckExceptionValidator {
  return new FraudCheckExceptionValidator(
    [
      new FraudCheckExceptionCurrencyLengthRule(32),
      new FraudCheckExceptionCodePrefixRule("Q"),
      new FraudCheckExceptionCreatedAtRangeRule(255, 1000),
      new FraudCheckExceptionTitleLengthRule(16),
      new FraudCheckExceptionCodeLengthRule(1000),
      new FraudCheckExceptionRequiredSourceRule("fraud check exception needs a value"),
    ],
  );
}
