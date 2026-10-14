import { AdaptiveConversionBatch } from "./adaptive-conversion-batch.js";

/** A rule a adaptive conversion batch must pass. Check returns its problems, or none. */
export interface AdaptiveConversionBatchRule {
  check(item: AdaptiveConversionBatch): string[];
}

export class AdaptiveConversionBatchRequiredNameRule implements AdaptiveConversionBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveConversionBatch): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveConversionBatchSegmentLengthRule implements AdaptiveConversionBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveConversionBatch): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveConversionBatchBudgetRangeRule implements AdaptiveConversionBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveConversionBatch): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class AdaptiveConversionBatchNameLengthRule implements AdaptiveConversionBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveConversionBatch): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a adaptive conversion batch. */
export class AdaptiveConversionBatchValidator {
  rules: AdaptiveConversionBatchRule[];

  constructor(rules: AdaptiveConversionBatchRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveConversionBatch): string[] {
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

  requireValid(item: AdaptiveConversionBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveConversionBatch[]): Map<string, string[]> {
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

export function defaultAdaptiveConversionBatchValidator(): AdaptiveConversionBatchValidator {
  return new AdaptiveConversionBatchValidator(
    [
      new AdaptiveConversionBatchRequiredNameRule("adaptive conversion batch needs an entry"),
      new AdaptiveConversionBatchSegmentLengthRule(120),
      new AdaptiveConversionBatchBudgetRangeRule(7.4, 3979.2),
      new AdaptiveConversionBatchNameLengthRule(120),
    ],
  );
}
