import { LegacyPathBatch } from "./legacy-path-batch.js";

/** A rule a legacy path batch must pass. Check returns its problems, or none. */
export interface LegacyPathBatchRule {
  check(item: LegacyPathBatch): string[];
}

export class LegacyPathBatchNameLengthRule implements LegacyPathBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyPathBatch): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyPathBatchRequiredCodeRule implements LegacyPathBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyPathBatch): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyPathBatchCodeLengthRule implements LegacyPathBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyPathBatch): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyPathBatchRequiredNameRule implements LegacyPathBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyPathBatch): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyPathBatchArchivedGuardRule implements LegacyPathBatchRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: LegacyPathBatch): string[] {
    if (item.archived && item.graceDays > this.limit) return [`grace days ${item.graceDays} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class LegacyPathBatchGraceDaysRangeRule implements LegacyPathBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyPathBatch): string[] {
    const value = item.graceDays;
    if (value < this.min || value > this.max) return [`grace days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a legacy path batch. */
export class LegacyPathBatchValidator {
  rules: LegacyPathBatchRule[];

  constructor(rules: LegacyPathBatchRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyPathBatch): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacyPathBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyPathBatch[]): Map<string, string[]> {
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

export function defaultLegacyPathBatchValidator(): LegacyPathBatchValidator {
  return new LegacyPathBatchValidator(
    [
      new LegacyPathBatchNameLengthRule(1000),
      new LegacyPathBatchRequiredCodeRule("legacy path batch needs this field"),
      new LegacyPathBatchCodeLengthRule(64),
      new LegacyPathBatchRequiredNameRule("legacy path batch needs a value"),
      new LegacyPathBatchArchivedGuardRule(255),
      new LegacyPathBatchGraceDaysRangeRule(16, 1000),
    ],
  );
}
