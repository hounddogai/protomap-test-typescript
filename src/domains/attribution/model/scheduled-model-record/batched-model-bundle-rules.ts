import { BatchedModelBundle } from "./batched-model-bundle.js";

/** A rule a batched model bundle must pass. Check returns its problems, or none. */
export interface BatchedModelBundleRule {
  check(item: BatchedModelBundle): string[];
}

export class BatchedModelBundleWindowDaysRangeRule implements BatchedModelBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedModelBundle): string[] {
    const value = item.windowDays;
    if (value < this.min || value > this.max) return [`window days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BatchedModelBundleRequiredChannelRule implements BatchedModelBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedModelBundle): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedModelBundleLabelLengthRule implements BatchedModelBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedModelBundle): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedModelBundleRequiredLabelRule implements BatchedModelBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedModelBundle): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedModelBundleCodeLengthRule implements BatchedModelBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedModelBundle): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedModelBundleBudgetRangeRule implements BatchedModelBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedModelBundle): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a batched model bundle. */
export class BatchedModelBundleValidator {
  rules: BatchedModelBundleRule[];

  constructor(rules: BatchedModelBundleRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedModelBundle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedModelBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedModelBundle[]): Map<string, string[]> {
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

export function defaultBatchedModelBundleValidator(): BatchedModelBundleValidator {
  return new BatchedModelBundleValidator(
    [
      new BatchedModelBundleWindowDaysRangeRule(16, 32),
      new BatchedModelBundleRequiredChannelRule("batched model bundle needs this field"),
      new BatchedModelBundleLabelLengthRule(64),
      new BatchedModelBundleRequiredLabelRule("batched model bundle needs an entry"),
      new BatchedModelBundleCodeLengthRule(86400),
      new BatchedModelBundleBudgetRangeRule(3.8, 3195.2),
    ],
  );
}
