import * as text from "../../../../kit/text.js";
import { SuppressionBudget } from "./suppression-budget.js";

/** A rule a suppression budget must pass. Check returns its problems, or none. */
export interface SuppressionBudgetRule {
  check(item: SuppressionBudget): string[];
}

export class SuppressionBudgetRequiredCodeRule implements SuppressionBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SuppressionBudget): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class SuppressionBudgetSegmentLengthRule implements SuppressionBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SuppressionBudget): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SuppressionBudgetRequiredLabelRule implements SuppressionBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SuppressionBudget): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class SuppressionBudgetAllowedCountryRule implements SuppressionBudgetRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SuppressionBudget): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.country))) return [`country ${item.country} is above maximum`];
    return [];
  }
}

export class SuppressionBudgetSequenceRangeRule implements SuppressionBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SuppressionBudget): string[] {
    const value = item.sequence;
    if (value < this.min || value > this.max) return [`sequence ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SuppressionBudgetCountryLengthRule implements SuppressionBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SuppressionBudget): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a suppression budget. */
export class SuppressionBudgetValidator {
  rules: SuppressionBudgetRule[];

  constructor(rules: SuppressionBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: SuppressionBudget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SuppressionBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SuppressionBudget[]): Map<string, string[]> {
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

export function defaultSuppressionBudgetValidator(): SuppressionBudgetValidator {
  return new SuppressionBudgetValidator(
    [
      new SuppressionBudgetRequiredCodeRule("suppression budget needs a value"),
      new SuppressionBudgetSegmentLengthRule(120),
      new SuppressionBudgetRequiredLabelRule("suppression budget needs this field"),
      new SuppressionBudgetAllowedCountryRule(["legacy", "regional", "tiered"]),
      new SuppressionBudgetSequenceRangeRule(32, 255),
      new SuppressionBudgetCountryLengthRule(86400),
    ],
  );
}
