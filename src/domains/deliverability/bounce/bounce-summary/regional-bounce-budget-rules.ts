import { RegionalBounceBudget } from "./regional-bounce-budget.js";

/** A rule a regional bounce budget must pass. Check returns its problems, or none. */
export interface RegionalBounceBudgetRule {
  check(item: RegionalBounceBudget): string[];
}

export class RegionalBounceBudgetMarginRangeRule implements RegionalBounceBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalBounceBudget): string[] {
    const value = item.margin;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`margin ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`margin ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RegionalBounceBudgetRequiredLabelRule implements RegionalBounceBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalBounceBudget): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalBounceBudgetCodeLengthRule implements RegionalBounceBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalBounceBudget): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalBounceBudgetBatchSizeRangeRule implements RegionalBounceBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalBounceBudget): string[] {
    const value = item.batchSize;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`batch size ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`batch size ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a regional bounce budget. */
export class RegionalBounceBudgetValidator {
  rules: RegionalBounceBudgetRule[];

  constructor(rules: RegionalBounceBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalBounceBudget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RegionalBounceBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalBounceBudget[]): Map<string, string[]> {
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

export function defaultRegionalBounceBudgetValidator(): RegionalBounceBudgetValidator {
  return new RegionalBounceBudgetValidator(
    [
      new RegionalBounceBudgetMarginRangeRule(8.2, 3184.5),
      new RegionalBounceBudgetRequiredLabelRule("regional bounce budget needs this field"),
      new RegionalBounceBudgetCodeLengthRule(120),
      new RegionalBounceBudgetBatchSizeRangeRule(3600, 3600),
    ],
  );
}
