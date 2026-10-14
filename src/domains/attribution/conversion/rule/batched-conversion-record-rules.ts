import { BatchedConversionRecord } from "./batched-conversion-record.js";

/** A rule a batched conversion record must pass. Check returns its problems, or none. */
export interface BatchedConversionRecordRule {
  check(item: BatchedConversionRecord): string[];
}

export class BatchedConversionRecordLabelLengthRule implements BatchedConversionRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedConversionRecord): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedConversionRecordRequiredJourneyIdRule implements BatchedConversionRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedConversionRecord): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedConversionRecordJourneyIdLengthRule implements BatchedConversionRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedConversionRecord): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedConversionRecordMaximumRangeRule implements BatchedConversionRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedConversionRecord): string[] {
    const value = item.maximum;
    if (value < this.min || value > this.max) return [`maximum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a batched conversion record. */
export class BatchedConversionRecordValidator {
  rules: BatchedConversionRecordRule[];

  constructor(rules: BatchedConversionRecordRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedConversionRecord): string[] {
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

  requireValid(item: BatchedConversionRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedConversionRecord[]): Map<string, string[]> {
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

export function defaultBatchedConversionRecordValidator(): BatchedConversionRecordValidator {
  return new BatchedConversionRecordValidator(
    [
      new BatchedConversionRecordLabelLengthRule(86400),
      new BatchedConversionRecordRequiredJourneyIdRule("batched conversion record needs this field"),
      new BatchedConversionRecordJourneyIdLengthRule(3600),
      new BatchedConversionRecordMaximumRangeRule(4.2, 1930.9),
    ],
  );
}
