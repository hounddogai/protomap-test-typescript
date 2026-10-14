import { WeightedConversionBudget } from "./weighted-conversion-budget.js";

/** A rule a weighted conversion budget must pass. Check returns its problems, or none. */
export interface WeightedConversionBudgetRule {
  check(item: WeightedConversionBudget): string[];
}

export class WeightedConversionBudgetChecksumLengthRule implements WeightedConversionBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedConversionBudget): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedConversionBudgetRequiredLabelRule implements WeightedConversionBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedConversionBudget): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedConversionBudgetCodeLengthRule implements WeightedConversionBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedConversionBudget): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedConversionBudgetCodePrefixRule implements WeightedConversionBudgetRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WeightedConversionBudget): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WeightedConversionBudgetDiscountRangeRule implements WeightedConversionBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedConversionBudget): string[] {
    const value = item.discount;
    if (value < this.min || value > this.max) return [`discount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WeightedConversionBudgetLabelLengthRule implements WeightedConversionBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedConversionBudget): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a weighted conversion budget. */
export class WeightedConversionBudgetValidator {
  rules: WeightedConversionBudgetRule[];

  constructor(rules: WeightedConversionBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedConversionBudget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedConversionBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedConversionBudget[]): Map<string, string[]> {
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

export function defaultWeightedConversionBudgetValidator(): WeightedConversionBudgetValidator {
  return new WeightedConversionBudgetValidator(
    [
      new WeightedConversionBudgetChecksumLengthRule(120),
      new WeightedConversionBudgetRequiredLabelRule("weighted conversion budget needs this field"),
      new WeightedConversionBudgetCodeLengthRule(255),
      new WeightedConversionBudgetCodePrefixRule("X"),
      new WeightedConversionBudgetDiscountRangeRule(9.3, 861.9),
      new WeightedConversionBudgetLabelLengthRule(3600),
    ],
  );
}
