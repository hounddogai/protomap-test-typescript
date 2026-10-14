import { DoubleOptInRecord } from "./double-opt-in-record.js";

/** A rule a double opt in record must pass. Check returns its problems, or none. */
export interface DoubleOptInRecordRule {
  check(item: DoubleOptInRecord): string[];
}

export class DoubleOptInRecordLabelLengthRule implements DoubleOptInRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DoubleOptInRecord): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DoubleOptInRecordMarginRangeRule implements DoubleOptInRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DoubleOptInRecord): string[] {
    const value = item.margin;
    if (value < this.min || value > this.max) return [`margin ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DoubleOptInRecordCreatedAtRangeRule implements DoubleOptInRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DoubleOptInRecord): string[] {
    const value = item.createdAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`created at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`created at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DoubleOptInRecordCodeLengthRule implements DoubleOptInRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DoubleOptInRecord): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DoubleOptInRecordRequiredCodeRule implements DoubleOptInRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DoubleOptInRecord): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a double opt in record. */
export class DoubleOptInRecordValidator {
  rules: DoubleOptInRecordRule[];

  constructor(rules: DoubleOptInRecordRule[]) {
    this.rules = rules;
  }

  validate(item: DoubleOptInRecord): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DoubleOptInRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DoubleOptInRecord[]): Map<string, string[]> {
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

export function defaultDoubleOptInRecordValidator(): DoubleOptInRecordValidator {
  return new DoubleOptInRecordValidator(
    [
      new DoubleOptInRecordLabelLengthRule(32),
      new DoubleOptInRecordMarginRangeRule(4.2, 4152.1),
      new DoubleOptInRecordCreatedAtRangeRule(64, 1000),
      new DoubleOptInRecordCodeLengthRule(1000),
      new DoubleOptInRecordRequiredCodeRule("double opt in record needs an entry"),
    ],
  );
}
