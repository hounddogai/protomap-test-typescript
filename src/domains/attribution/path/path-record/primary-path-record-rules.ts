import { PrimaryPathRecord } from "./primary-path-record.js";

/** A rule a primary path record must pass. Check returns its problems, or none. */
export interface PrimaryPathRecordRule {
  check(item: PrimaryPathRecord): string[];
}

export class PrimaryPathRecordExpiresAtRangeRule implements PrimaryPathRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryPathRecord): string[] {
    const value = item.expiresAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`expires at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`expires at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PrimaryPathRecordDescriptionLengthRule implements PrimaryPathRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryPathRecord): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryPathRecordRequiredCodeRule implements PrimaryPathRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryPathRecord): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryPathRecordChecksumLengthRule implements PrimaryPathRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryPathRecord): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a primary path record. */
export class PrimaryPathRecordValidator {
  rules: PrimaryPathRecordRule[];

  constructor(rules: PrimaryPathRecordRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryPathRecord): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryPathRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryPathRecord[]): Map<string, string[]> {
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

export function defaultPrimaryPathRecordValidator(): PrimaryPathRecordValidator {
  return new PrimaryPathRecordValidator(
    [
      new PrimaryPathRecordExpiresAtRangeRule(32, 120),
      new PrimaryPathRecordDescriptionLengthRule(255),
      new PrimaryPathRecordRequiredCodeRule("primary path record needs this field"),
      new PrimaryPathRecordChecksumLengthRule(64),
    ],
  );
}
