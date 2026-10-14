import * as text from "../../../../kit/text.js";
import { ManualChallengeBatch } from "./manual-challenge-batch.js";

/** A rule a manual challenge batch must pass. Check returns its problems, or none. */
export interface ManualChallengeBatchRule {
  check(item: ManualChallengeBatch): string[];
}

export class ManualChallengeBatchAllowedCodeRule implements ManualChallengeBatchRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ManualChallengeBatch): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is missing`];
    return [];
  }
}

export class ManualChallengeBatchCodeLengthRule implements ManualChallengeBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualChallengeBatch): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualChallengeBatchRequiredTitleRule implements ManualChallengeBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualChallengeBatch): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class ManualChallengeBatchAttemptsRangeRule implements ManualChallengeBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualChallengeBatch): string[] {
    const value = item.attempts;
    if (value < this.min || value > this.max) return [`attempts ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ManualChallengeBatchRequiredCodeRule implements ManualChallengeBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualChallengeBatch): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ManualChallengeBatchAmountRangeRule implements ManualChallengeBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualChallengeBatch): string[] {
    const value = item.amount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`amount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`amount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a manual challenge batch. */
export class ManualChallengeBatchValidator {
  rules: ManualChallengeBatchRule[];

  constructor(rules: ManualChallengeBatchRule[]) {
    this.rules = rules;
  }

  validate(item: ManualChallengeBatch): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualChallengeBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualChallengeBatch[]): Map<string, string[]> {
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

export function defaultManualChallengeBatchValidator(): ManualChallengeBatchValidator {
  return new ManualChallengeBatchValidator(
    [
      new ManualChallengeBatchAllowedCodeRule(["default", "primary", "primary"]),
      new ManualChallengeBatchCodeLengthRule(16),
      new ManualChallengeBatchRequiredTitleRule("manual challenge batch needs an entry"),
      new ManualChallengeBatchAttemptsRangeRule(32, 80),
      new ManualChallengeBatchRequiredCodeRule("manual challenge batch needs this field"),
      new ManualChallengeBatchAmountRangeRule(9, 225.5),
    ],
  );
}
