import { LenientOptOutBatch } from "./lenient-opt-out-batch.js";

/** A rule a lenient opt out batch must pass. Check returns its problems, or none. */
export interface LenientOptOutBatchRule {
  check(item: LenientOptOutBatch): string[];
}

export class LenientOptOutBatchRequiredLocaleRule implements LenientOptOutBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientOptOutBatch): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class LenientOptOutBatchLimitRangeRule implements LenientOptOutBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientOptOutBatch): string[] {
    const value = item.limit;
    if (value < this.min || value > this.max) return [`limit ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientOptOutBatchCodeLengthRule implements LenientOptOutBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientOptOutBatch): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientOptOutBatchSourceLengthRule implements LenientOptOutBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientOptOutBatch): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a lenient opt out batch. */
export class LenientOptOutBatchValidator {
  rules: LenientOptOutBatchRule[];

  constructor(rules: LenientOptOutBatchRule[]) {
    this.rules = rules;
  }

  validate(item: LenientOptOutBatch): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientOptOutBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientOptOutBatch[]): Map<string, string[]> {
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

export function defaultLenientOptOutBatchValidator(): LenientOptOutBatchValidator {
  return new LenientOptOutBatchValidator(
    [
      new LenientOptOutBatchRequiredLocaleRule("lenient opt out batch needs a value"),
      new LenientOptOutBatchLimitRangeRule(16, 64),
      new LenientOptOutBatchCodeLengthRule(86400),
      new LenientOptOutBatchSourceLengthRule(80),
    ],
  );
}
