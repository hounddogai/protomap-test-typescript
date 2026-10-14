import { CappedRewardBatch } from "./capped-reward-batch.js";

/** A rule a capped reward batch must pass. Check returns its problems, or none. */
export interface CappedRewardBatchRule {
  check(item: CappedRewardBatch): string[];
}

export class CappedRewardBatchRequiredLocaleRule implements CappedRewardBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedRewardBatch): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class CappedRewardBatchUnitLengthRule implements CappedRewardBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedRewardBatch): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedRewardBatchAmountRangeRule implements CappedRewardBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedRewardBatch): string[] {
    const value = item.amount;
    if (value < this.min || value > this.max) return [`amount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CappedRewardBatchCodeLengthRule implements CappedRewardBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedRewardBatch): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedRewardBatchLabelLengthRule implements CappedRewardBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedRewardBatch): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a capped reward batch. */
export class CappedRewardBatchValidator {
  rules: CappedRewardBatchRule[];

  constructor(rules: CappedRewardBatchRule[]) {
    this.rules = rules;
  }

  validate(item: CappedRewardBatch): string[] {
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

  requireValid(item: CappedRewardBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedRewardBatch[]): Map<string, string[]> {
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

export function defaultCappedRewardBatchValidator(): CappedRewardBatchValidator {
  return new CappedRewardBatchValidator(
    [
      new CappedRewardBatchRequiredLocaleRule("capped reward batch needs a value"),
      new CappedRewardBatchUnitLengthRule(16),
      new CappedRewardBatchAmountRangeRule(0.9, 3502.4),
      new CappedRewardBatchCodeLengthRule(120),
      new CappedRewardBatchLabelLengthRule(80),
    ],
  );
}
