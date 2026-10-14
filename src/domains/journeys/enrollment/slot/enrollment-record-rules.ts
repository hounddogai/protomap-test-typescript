import * as text from "../../../../kit/text.js";
import { EnrollmentRecord } from "./enrollment-record.js";

/** A rule a enrollment record must pass. Check returns its problems, or none. */
export interface EnrollmentRecordRule {
  check(item: EnrollmentRecord): string[];
}

export class EnrollmentRecordActiveGuardRule implements EnrollmentRecordRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: EnrollmentRecord): string[] {
    if (item.active && item.impressions > this.limit) return [`impressions ${item.impressions} exceeds ${this.limit} while active`];
    return [];
  }
}

export class EnrollmentRecordAllowedTitleRule implements EnrollmentRecordRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: EnrollmentRecord): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is expired`];
    return [];
  }
}

export class EnrollmentRecordWeightRangeRule implements EnrollmentRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EnrollmentRecord): string[] {
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

/** Runs every rule of a enrollment record. */
export class EnrollmentRecordValidator {
  rules: EnrollmentRecordRule[];

  constructor(rules: EnrollmentRecordRule[]) {
    this.rules = rules;
  }

  validate(item: EnrollmentRecord): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: EnrollmentRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: EnrollmentRecord[]): Map<string, string[]> {
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

export function defaultEnrollmentRecordValidator(): EnrollmentRecordValidator {
  return new EnrollmentRecordValidator(
    [
      new EnrollmentRecordActiveGuardRule(1000),
      new EnrollmentRecordAllowedTitleRule(["fallback"]),
      new EnrollmentRecordWeightRangeRule(1.7, 3829.7),
    ],
  );
}
