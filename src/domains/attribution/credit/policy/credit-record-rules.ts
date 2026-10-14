import { CreditRecord } from "./credit-record.js";

/** A rule a credit record must pass. Check returns its problems, or none. */
export interface CreditRecordRule {
  check(item: CreditRecord): string[];
}

export class CreditRecordQuantityRangeRule implements CreditRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreditRecord): string[] {
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

export class CreditRecordCodePrefixRule implements CreditRecordRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CreditRecord): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CreditRecordConversionRateRangeRule implements CreditRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreditRecord): string[] {
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

export class CreditRecordCodeLengthRule implements CreditRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreditRecord): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreditRecordCeilingRangeRule implements CreditRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreditRecord): string[] {
    const value = item.ceiling;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ceiling ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ceiling ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CreditRecordRequiredJourneyIdRule implements CreditRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreditRecord): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a credit record. */
export class CreditRecordValidator {
  rules: CreditRecordRule[];

  constructor(rules: CreditRecordRule[]) {
    this.rules = rules;
  }

  validate(item: CreditRecord): string[] {
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

  requireValid(item: CreditRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CreditRecord[]): Map<string, string[]> {
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

export function defaultCreditRecordValidator(): CreditRecordValidator {
  return new CreditRecordValidator(
    [
      new CreditRecordQuantityRangeRule(80, 86400),
      new CreditRecordCodePrefixRule("ACM"),
      new CreditRecordConversionRateRangeRule(7.7, 1277),
      new CreditRecordCodeLengthRule(120),
      new CreditRecordCeilingRangeRule(9.1, 3361.6),
      new CreditRecordRequiredJourneyIdRule("credit record needs an entry"),
    ],
  );
}
