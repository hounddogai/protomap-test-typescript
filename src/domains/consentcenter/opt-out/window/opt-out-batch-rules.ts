import { OptOutBatch } from "./opt-out-batch.js";

/** A rule a opt out batch must pass. Check returns its problems, or none. */
export interface OptOutBatchRule {
  check(item: OptOutBatch): string[];
}

export class OptOutBatchCodeLengthRule implements OptOutBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: OptOutBatch): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class OptOutBatchChecksumLengthRule implements OptOutBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: OptOutBatch): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class OptOutBatchTitleLengthRule implements OptOutBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: OptOutBatch): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class OptOutBatchFloorValueRangeRule implements OptOutBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: OptOutBatch): string[] {
    const value = item.floorValue;
    if (value < this.min || value > this.max) return [`floor value ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a opt out batch. */
export class OptOutBatchValidator {
  rules: OptOutBatchRule[];

  constructor(rules: OptOutBatchRule[]) {
    this.rules = rules;
  }

  validate(item: OptOutBatch): string[] {
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

  requireValid(item: OptOutBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: OptOutBatch[]): Map<string, string[]> {
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

export function defaultOptOutBatchValidator(): OptOutBatchValidator {
  return new OptOutBatchValidator(
    [
      new OptOutBatchCodeLengthRule(120),
      new OptOutBatchChecksumLengthRule(255),
      new OptOutBatchTitleLengthRule(80),
      new OptOutBatchFloorValueRangeRule(7.2, 2778.2),
    ],
  );
}
