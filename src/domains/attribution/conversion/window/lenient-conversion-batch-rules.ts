import { LenientConversionBatch } from "./lenient-conversion-batch.js";

/** A rule a lenient conversion batch must pass. Check returns its problems, or none. */
export interface LenientConversionBatchRule {
  check(item: LenientConversionBatch): string[];
}

export class LenientConversionBatchImpressionsRangeRule implements LenientConversionBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientConversionBatch): string[] {
    const value = item.impressions;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`impressions ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`impressions ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LenientConversionBatchRequiredLocaleRule implements LenientConversionBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientConversionBatch): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class LenientConversionBatchCountryLengthRule implements LenientConversionBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientConversionBatch): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a lenient conversion batch. */
export class LenientConversionBatchValidator {
  rules: LenientConversionBatchRule[];

  constructor(rules: LenientConversionBatchRule[]) {
    this.rules = rules;
  }

  validate(item: LenientConversionBatch): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientConversionBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientConversionBatch[]): Map<string, string[]> {
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

export function defaultLenientConversionBatchValidator(): LenientConversionBatchValidator {
  return new LenientConversionBatchValidator(
    [
      new LenientConversionBatchImpressionsRangeRule(80, 120),
      new LenientConversionBatchRequiredLocaleRule("lenient conversion batch needs this field"),
      new LenientConversionBatchCountryLengthRule(16),
    ],
  );
}
