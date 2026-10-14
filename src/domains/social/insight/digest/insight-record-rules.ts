import { InsightRecord } from "./insight-record.js";

/** A rule a insight record must pass. Check returns its problems, or none. */
export interface InsightRecordRule {
  check(item: InsightRecord): string[];
}

export class InsightRecordRequiredNameRule implements InsightRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InsightRecord): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class InsightRecordCohortLengthRule implements InsightRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InsightRecord): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class InsightRecordRequiredVariantRule implements InsightRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InsightRecord): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

export class InsightRecordUpdatedAtRangeRule implements InsightRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: InsightRecord): string[] {
    const value = item.updatedAt;
    if (value < this.min || value > this.max) return [`updated at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a insight record. */
export class InsightRecordValidator {
  rules: InsightRecordRule[];

  constructor(rules: InsightRecordRule[]) {
    this.rules = rules;
  }

  validate(item: InsightRecord): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: InsightRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: InsightRecord[]): Map<string, string[]> {
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

export function defaultInsightRecordValidator(): InsightRecordValidator {
  return new InsightRecordValidator(
    [
      new InsightRecordRequiredNameRule("insight record needs a value"),
      new InsightRecordCohortLengthRule(86400),
      new InsightRecordRequiredVariantRule("insight record needs this field"),
      new InsightRecordUpdatedAtRangeRule(32, 120),
    ],
  );
}
