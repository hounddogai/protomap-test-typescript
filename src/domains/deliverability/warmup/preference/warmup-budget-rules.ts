import { WarmupBudget } from "./warmup-budget.js";

/** A rule a warmup budget must pass. Check returns its problems, or none. */
export interface WarmupBudgetRule {
  check(item: WarmupBudget): string[];
}

export class WarmupBudgetLabelLengthRule implements WarmupBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WarmupBudget): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WarmupBudgetRequiredLabelRule implements WarmupBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WarmupBudget): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class WarmupBudgetRequiredChannelRule implements WarmupBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WarmupBudget): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a warmup budget. */
export class WarmupBudgetValidator {
  rules: WarmupBudgetRule[];

  constructor(rules: WarmupBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: WarmupBudget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WarmupBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WarmupBudget[]): Map<string, string[]> {
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

export function defaultWarmupBudgetValidator(): WarmupBudgetValidator {
  return new WarmupBudgetValidator(
    [
      new WarmupBudgetLabelLengthRule(255),
      new WarmupBudgetRequiredLabelRule("warmup budget needs this field"),
      new WarmupBudgetRequiredChannelRule("warmup budget needs a value"),
    ],
  );
}
