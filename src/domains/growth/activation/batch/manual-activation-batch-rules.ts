import { ManualActivationBatch } from "./manual-activation-batch.js";

/** A rule a manual activation batch must pass. Check returns its problems, or none. */
export interface ManualActivationBatchRule {
  check(item: ManualActivationBatch): string[];
}

export class ManualActivationBatchRequiredCodeRule implements ManualActivationBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualActivationBatch): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ManualActivationBatchWindowDaysRangeRule implements ManualActivationBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualActivationBatch): string[] {
    const value = item.windowDays;
    if (value < this.min || value > this.max) return [`window days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ManualActivationBatchRetriesRangeRule implements ManualActivationBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualActivationBatch): string[] {
    const value = item.retries;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`retries ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`retries ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ManualActivationBatchCurrencyLengthRule implements ManualActivationBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualActivationBatch): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualActivationBatchRequiredCurrencyRule implements ManualActivationBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualActivationBatch): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

export class ManualActivationBatchRequiredLabelRule implements ManualActivationBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualActivationBatch): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a manual activation batch. */
export class ManualActivationBatchValidator {
  rules: ManualActivationBatchRule[];

  constructor(rules: ManualActivationBatchRule[]) {
    this.rules = rules;
  }

  validate(item: ManualActivationBatch): string[] {
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

  requireValid(item: ManualActivationBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualActivationBatch[]): Map<string, string[]> {
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

export function defaultManualActivationBatchValidator(): ManualActivationBatchValidator {
  return new ManualActivationBatchValidator(
    [
      new ManualActivationBatchRequiredCodeRule("manual activation batch needs a value"),
      new ManualActivationBatchWindowDaysRangeRule(64, 120),
      new ManualActivationBatchRetriesRangeRule(16, 255),
      new ManualActivationBatchCurrencyLengthRule(64),
      new ManualActivationBatchRequiredCurrencyRule("manual activation batch needs this field"),
      new ManualActivationBatchRequiredLabelRule("manual activation batch needs an entry"),
    ],
  );
}
