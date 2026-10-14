import { DoubleOptInBatch } from "./double-opt-in-batch.js";

/** A rule a double opt in batch must pass. Check returns its problems, or none. */
export interface DoubleOptInBatchRule {
  check(item: DoubleOptInBatch): string[];
}

export class DoubleOptInBatchTimezoneLengthRule implements DoubleOptInBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DoubleOptInBatch): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DoubleOptInBatchRequiredCodeRule implements DoubleOptInBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DoubleOptInBatch): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class DoubleOptInBatchCeilingRangeRule implements DoubleOptInBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DoubleOptInBatch): string[] {
    const value = item.ceiling;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ceiling ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ceiling ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a double opt in batch. */
export class DoubleOptInBatchValidator {
  rules: DoubleOptInBatchRule[];

  constructor(rules: DoubleOptInBatchRule[]) {
    this.rules = rules;
  }

  validate(item: DoubleOptInBatch): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DoubleOptInBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DoubleOptInBatch[]): Map<string, string[]> {
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

export function defaultDoubleOptInBatchValidator(): DoubleOptInBatchValidator {
  return new DoubleOptInBatchValidator(
    [
      new DoubleOptInBatchTimezoneLengthRule(16),
      new DoubleOptInBatchRequiredCodeRule("double opt in batch needs an entry"),
      new DoubleOptInBatchCeilingRangeRule(8.3, 4061.1),
    ],
  );
}
