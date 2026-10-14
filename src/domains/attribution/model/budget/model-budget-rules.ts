import { ModelBudget } from "./model-budget.js";

/** A rule a model budget must pass. Check returns its problems, or none. */
export interface ModelBudgetRule {
  check(item: ModelBudget): string[];
}

export class ModelBudgetCapacityRangeRule implements ModelBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ModelBudget): string[] {
    const value = item.capacity;
    if (value < this.min || value > this.max) return [`capacity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ModelBudgetCeilingRangeRule implements ModelBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ModelBudget): string[] {
    const value = item.ceiling;
    if (value < this.min || value > this.max) return [`ceiling ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ModelBudgetSummaryLengthRule implements ModelBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ModelBudget): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ModelBudgetCodeLengthRule implements ModelBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ModelBudget): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ModelBudgetRequiredOwnerIdRule implements ModelBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ModelBudget): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a model budget. */
export class ModelBudgetValidator {
  rules: ModelBudgetRule[];

  constructor(rules: ModelBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: ModelBudget): string[] {
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

  requireValid(item: ModelBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ModelBudget[]): Map<string, string[]> {
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

export function defaultModelBudgetValidator(): ModelBudgetValidator {
  return new ModelBudgetValidator(
    [
      new ModelBudgetCapacityRangeRule(120, 86400),
      new ModelBudgetCeilingRangeRule(8.7, 1196.7),
      new ModelBudgetSummaryLengthRule(255),
      new ModelBudgetCodeLengthRule(3600),
      new ModelBudgetRequiredOwnerIdRule("model budget needs an entry"),
    ],
  );
}
