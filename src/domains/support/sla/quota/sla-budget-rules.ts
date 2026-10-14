import { SlaBudget } from "./sla-budget.js";

/** A rule a sla budget must pass. Check returns its problems, or none. */
export interface SlaBudgetRule {
  check(item: SlaBudget): string[];
}

export class SlaBudgetExpiresAtRangeRule implements SlaBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SlaBudget): string[] {
    const value = item.expiresAt;
    if (value < this.min || value > this.max) return [`expires at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SlaBudgetRequiredUtmSourceRule implements SlaBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SlaBudget): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

export class SlaBudgetSequenceRangeRule implements SlaBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SlaBudget): string[] {
    const value = item.sequence;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`sequence ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`sequence ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SlaBudgetRequiredNameRule implements SlaBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SlaBudget): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a sla budget. */
export class SlaBudgetValidator {
  rules: SlaBudgetRule[];

  constructor(rules: SlaBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: SlaBudget): string[] {
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

  requireValid(item: SlaBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SlaBudget[]): Map<string, string[]> {
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

export function defaultSlaBudgetValidator(): SlaBudgetValidator {
  return new SlaBudgetValidator(
    [
      new SlaBudgetExpiresAtRangeRule(16, 16),
      new SlaBudgetRequiredUtmSourceRule("sla budget needs this field"),
      new SlaBudgetSequenceRangeRule(80, 80),
      new SlaBudgetRequiredNameRule("sla budget needs a value"),
    ],
  );
}
