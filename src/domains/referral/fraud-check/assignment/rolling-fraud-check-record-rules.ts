import { RollingFraudCheckRecord } from "./rolling-fraud-check-record.js";

/** A rule a rolling fraud check record must pass. Check returns its problems, or none. */
export interface RollingFraudCheckRecordRule {
  check(item: RollingFraudCheckRecord): string[];
}

export class RollingFraudCheckRecordTitleLengthRule implements RollingFraudCheckRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingFraudCheckRecord): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingFraudCheckRecordRequiredCodeRule implements RollingFraudCheckRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingFraudCheckRecord): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RollingFraudCheckRecordCodeLengthRule implements RollingFraudCheckRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingFraudCheckRecord): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a rolling fraud check record. */
export class RollingFraudCheckRecordValidator {
  rules: RollingFraudCheckRecordRule[];

  constructor(rules: RollingFraudCheckRecordRule[]) {
    this.rules = rules;
  }

  validate(item: RollingFraudCheckRecord): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingFraudCheckRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingFraudCheckRecord[]): Map<string, string[]> {
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

export function defaultRollingFraudCheckRecordValidator(): RollingFraudCheckRecordValidator {
  return new RollingFraudCheckRecordValidator(
    [
      new RollingFraudCheckRecordTitleLengthRule(16),
      new RollingFraudCheckRecordRequiredCodeRule("rolling fraud check record needs a value"),
      new RollingFraudCheckRecordCodeLengthRule(255),
    ],
  );
}
