import { CreditBudget } from "./credit-budget.js";

/** A rule a credit budget must pass. Check returns its problems, or none. */
export interface CreditBudgetRule {
  check(item: CreditBudget): string[];
}

export class CreditBudgetCodePrefixRule implements CreditBudgetRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CreditBudget): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CreditBudgetWindowDaysRangeRule implements CreditBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreditBudget): string[] {
    const value = item.windowDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`window days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`window days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CreditBudgetFloorValueRangeRule implements CreditBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreditBudget): string[] {
    const value = item.floorValue;
    if (value < this.min || value > this.max) return [`floor value ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CreditBudgetRequiredCodeRule implements CreditBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreditBudget): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CreditBudgetNameLengthRule implements CreditBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreditBudget): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a credit budget. */
export class CreditBudgetValidator {
  rules: CreditBudgetRule[];

  constructor(rules: CreditBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: CreditBudget): string[] {
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

  requireValid(item: CreditBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CreditBudget[]): Map<string, string[]> {
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

export function defaultCreditBudgetValidator(): CreditBudgetValidator {
  return new CreditBudgetValidator(
    [
      new CreditBudgetCodePrefixRule("Q"),
      new CreditBudgetWindowDaysRangeRule(64, 3600),
      new CreditBudgetFloorValueRangeRule(5.6, 3285.9),
      new CreditBudgetRequiredCodeRule("credit budget needs an entry"),
      new CreditBudgetNameLengthRule(255),
    ],
  );
}
