import { ProofBudget } from "./proof-budget.js";

/** A rule a proof budget must pass. Check returns its problems, or none. */
export interface ProofBudgetRule {
  check(item: ProofBudget): string[];
}

export class ProofBudgetCodePrefixRule implements ProofBudgetRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ProofBudget): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ProofBudgetRequiredNameRule implements ProofBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ProofBudget): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class ProofBudgetCapacityRangeRule implements ProofBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ProofBudget): string[] {
    const value = item.capacity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`capacity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`capacity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ProofBudgetRequiredCodeRule implements ProofBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ProofBudget): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ProofBudgetCodeLengthRule implements ProofBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ProofBudget): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ProofBudgetRequiredLocaleRule implements ProofBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ProofBudget): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a proof budget. */
export class ProofBudgetValidator {
  rules: ProofBudgetRule[];

  constructor(rules: ProofBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: ProofBudget): string[] {
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

  requireValid(item: ProofBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ProofBudget[]): Map<string, string[]> {
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

export function defaultProofBudgetValidator(): ProofBudgetValidator {
  return new ProofBudgetValidator(
    [
      new ProofBudgetCodePrefixRule("X"),
      new ProofBudgetRequiredNameRule("proof budget needs an entry"),
      new ProofBudgetCapacityRangeRule(16, 255),
      new ProofBudgetRequiredCodeRule("proof budget needs a value"),
      new ProofBudgetCodeLengthRule(80),
      new ProofBudgetRequiredLocaleRule("proof budget needs a value"),
    ],
  );
}
