import { BounceBudget } from "./bounce-budget.js";

/** A rule a bounce budget must pass. Check returns its problems, or none. */
export interface BounceBudgetRule {
  check(item: BounceBudget): string[];
}

export class BounceBudgetRequiredChannelRule implements BounceBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BounceBudget): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class BounceBudgetCodeLengthRule implements BounceBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BounceBudget): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BounceBudgetNameLengthRule implements BounceBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BounceBudget): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a bounce budget. */
export class BounceBudgetValidator {
  rules: BounceBudgetRule[];

  constructor(rules: BounceBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: BounceBudget): string[] {
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

  requireValid(item: BounceBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BounceBudget[]): Map<string, string[]> {
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

export function defaultBounceBudgetValidator(): BounceBudgetValidator {
  return new BounceBudgetValidator(
    [
      new BounceBudgetRequiredChannelRule("bounce budget needs an entry"),
      new BounceBudgetCodeLengthRule(80),
      new BounceBudgetNameLengthRule(120),
    ],
  );
}
