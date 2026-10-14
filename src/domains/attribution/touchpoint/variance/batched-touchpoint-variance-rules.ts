import { BatchedTouchpointVariance } from "./batched-touchpoint-variance.js";

/** A rule a batched touchpoint variance must pass. Check returns its problems, or none. */
export interface BatchedTouchpointVarianceRule {
  check(item: BatchedTouchpointVariance): string[];
}

export class BatchedTouchpointVarianceRequiredTitleRule implements BatchedTouchpointVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedTouchpointVariance): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedTouchpointVarianceCodeLengthRule implements BatchedTouchpointVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedTouchpointVariance): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedTouchpointVarianceRatioRangeRule implements BatchedTouchpointVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedTouchpointVariance): string[] {
    const value = item.ratio;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ratio ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ratio ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a batched touchpoint variance. */
export class BatchedTouchpointVarianceValidator {
  rules: BatchedTouchpointVarianceRule[];

  constructor(rules: BatchedTouchpointVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedTouchpointVariance): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedTouchpointVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedTouchpointVariance[]): Map<string, string[]> {
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

export function defaultBatchedTouchpointVarianceValidator(): BatchedTouchpointVarianceValidator {
  return new BatchedTouchpointVarianceValidator(
    [
      new BatchedTouchpointVarianceRequiredTitleRule("batched touchpoint variance needs a value"),
      new BatchedTouchpointVarianceCodeLengthRule(1000),
      new BatchedTouchpointVarianceRatioRangeRule(6.2, 2622.3),
    ],
  );
}
