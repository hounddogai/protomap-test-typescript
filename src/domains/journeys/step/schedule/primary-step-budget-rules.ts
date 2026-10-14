import { PrimaryStepBudget } from "./primary-step-budget.js";

/** A rule a primary step budget must pass. Check returns its problems, or none. */
export interface PrimaryStepBudgetRule {
  check(item: PrimaryStepBudget): string[];
}

export class PrimaryStepBudgetBudgetRangeRule implements PrimaryStepBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryStepBudget): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PrimaryStepBudgetRegionLengthRule implements PrimaryStepBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryStepBudget): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryStepBudgetSendAtRangeRule implements PrimaryStepBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryStepBudget): string[] {
    const value = item.sendAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`send at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`send at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PrimaryStepBudgetCodeLengthRule implements PrimaryStepBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryStepBudget): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryStepBudgetRequiredRegionRule implements PrimaryStepBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryStepBudget): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryStepBudgetLabelLengthRule implements PrimaryStepBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryStepBudget): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a primary step budget. */
export class PrimaryStepBudgetValidator {
  rules: PrimaryStepBudgetRule[];

  constructor(rules: PrimaryStepBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryStepBudget): string[] {
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

  requireValid(item: PrimaryStepBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryStepBudget[]): Map<string, string[]> {
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

export function defaultPrimaryStepBudgetValidator(): PrimaryStepBudgetValidator {
  return new PrimaryStepBudgetValidator(
    [
      new PrimaryStepBudgetBudgetRangeRule(5.1, 4723.7),
      new PrimaryStepBudgetRegionLengthRule(3600),
      new PrimaryStepBudgetSendAtRangeRule(32, 255),
      new PrimaryStepBudgetCodeLengthRule(32),
      new PrimaryStepBudgetRequiredRegionRule("primary step budget needs this field"),
      new PrimaryStepBudgetLabelLengthRule(64),
    ],
  );
}
