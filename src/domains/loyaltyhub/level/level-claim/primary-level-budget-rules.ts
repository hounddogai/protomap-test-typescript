import * as text from "../../../../kit/text.js";
import { PrimaryLevelBudget } from "./primary-level-budget.js";

/** A rule a primary level budget must pass. Check returns its problems, or none. */
export interface PrimaryLevelBudgetRule {
  check(item: PrimaryLevelBudget): string[];
}

export class PrimaryLevelBudgetCodePrefixRule implements PrimaryLevelBudgetRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PrimaryLevelBudget): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PrimaryLevelBudgetCodeLengthRule implements PrimaryLevelBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryLevelBudget): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryLevelBudgetRevisionRangeRule implements PrimaryLevelBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryLevelBudget): string[] {
    const value = item.revision;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`revision ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`revision ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PrimaryLevelBudgetMarginRangeRule implements PrimaryLevelBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryLevelBudget): string[] {
    const value = item.margin;
    if (value < this.min || value > this.max) return [`margin ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PrimaryLevelBudgetSequenceRangeRule implements PrimaryLevelBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryLevelBudget): string[] {
    const value = item.sequence;
    if (value < this.min || value > this.max) return [`sequence ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PrimaryLevelBudgetAllowedLabelRule implements PrimaryLevelBudgetRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PrimaryLevelBudget): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is inconsistent`];
    return [];
  }
}

/** Runs every rule of a primary level budget. */
export class PrimaryLevelBudgetValidator {
  rules: PrimaryLevelBudgetRule[];

  constructor(rules: PrimaryLevelBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryLevelBudget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryLevelBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryLevelBudget[]): Map<string, string[]> {
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

export function defaultPrimaryLevelBudgetValidator(): PrimaryLevelBudgetValidator {
  return new PrimaryLevelBudgetValidator(
    [
      new PrimaryLevelBudgetCodePrefixRule("X"),
      new PrimaryLevelBudgetCodeLengthRule(80),
      new PrimaryLevelBudgetRevisionRangeRule(255, 86400),
      new PrimaryLevelBudgetMarginRangeRule(3.6, 4538.5),
      new PrimaryLevelBudgetSequenceRangeRule(32, 80),
      new PrimaryLevelBudgetAllowedLabelRule([]),
    ],
  );
}
