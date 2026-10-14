import { TouchpointBatch } from "./touchpoint-batch.js";

/** A rule a touchpoint batch must pass. Check returns its problems, or none. */
export interface TouchpointBatchRule {
  check(item: TouchpointBatch): string[];
}

export class TouchpointBatchConversionRateRangeRule implements TouchpointBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TouchpointBatch): string[] {
    const value = item.conversionRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`conversion rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`conversion rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TouchpointBatchBatchSizeRangeRule implements TouchpointBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TouchpointBatch): string[] {
    const value = item.batchSize;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`batch size ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`batch size ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TouchpointBatchTitleLengthRule implements TouchpointBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TouchpointBatch): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a touchpoint batch. */
export class TouchpointBatchValidator {
  rules: TouchpointBatchRule[];

  constructor(rules: TouchpointBatchRule[]) {
    this.rules = rules;
  }

  validate(item: TouchpointBatch): string[] {
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

  requireValid(item: TouchpointBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TouchpointBatch[]): Map<string, string[]> {
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

export function defaultTouchpointBatchValidator(): TouchpointBatchValidator {
  return new TouchpointBatchValidator(
    [
      new TouchpointBatchConversionRateRangeRule(2.6, 1554.1),
      new TouchpointBatchBatchSizeRangeRule(80, 86400),
      new TouchpointBatchTitleLengthRule(1000),
    ],
  );
}
