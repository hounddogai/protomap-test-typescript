import { CreditBatch } from "./credit-batch.js";

/** A rule a credit batch must pass. Check returns its problems, or none. */
export interface CreditBatchRule {
  check(item: CreditBatch): string[];
}

export class CreditBatchRequiredCodeRule implements CreditBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreditBatch): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CreditBatchSourceLengthRule implements CreditBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreditBatch): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreditBatchRequiredNotesRule implements CreditBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreditBatch): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

export class CreditBatchWindowDaysRangeRule implements CreditBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreditBatch): string[] {
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

/** Runs every rule of a credit batch. */
export class CreditBatchValidator {
  rules: CreditBatchRule[];

  constructor(rules: CreditBatchRule[]) {
    this.rules = rules;
  }

  validate(item: CreditBatch): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CreditBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CreditBatch[]): Map<string, string[]> {
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

export function defaultCreditBatchValidator(): CreditBatchValidator {
  return new CreditBatchValidator(
    [
      new CreditBatchRequiredCodeRule("credit batch needs a value"),
      new CreditBatchSourceLengthRule(86400),
      new CreditBatchRequiredNotesRule("credit batch needs an entry"),
      new CreditBatchWindowDaysRangeRule(16, 32),
    ],
  );
}
