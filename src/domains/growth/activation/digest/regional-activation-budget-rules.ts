import { RegionalActivationBudget } from "./regional-activation-budget.js";

/** A rule a regional activation budget must pass. Check returns its problems, or none. */
export interface RegionalActivationBudgetRule {
  check(item: RegionalActivationBudget): string[];
}

export class RegionalActivationBudgetSourceLengthRule implements RegionalActivationBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalActivationBudget): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalActivationBudgetSendAtRangeRule implements RegionalActivationBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalActivationBudget): string[] {
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

export class RegionalActivationBudgetNameLengthRule implements RegionalActivationBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalActivationBudget): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalActivationBudgetVisibleGuardRule implements RegionalActivationBudgetRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: RegionalActivationBudget): string[] {
    if (item.visible && item.expiresAt > this.limit) return [`expires at ${item.expiresAt} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class RegionalActivationBudgetCodeLengthRule implements RegionalActivationBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalActivationBudget): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalActivationBudgetRequiredNameRule implements RegionalActivationBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalActivationBudget): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a regional activation budget. */
export class RegionalActivationBudgetValidator {
  rules: RegionalActivationBudgetRule[];

  constructor(rules: RegionalActivationBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalActivationBudget): string[] {
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

  requireValid(item: RegionalActivationBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalActivationBudget[]): Map<string, string[]> {
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

export function defaultRegionalActivationBudgetValidator(): RegionalActivationBudgetValidator {
  return new RegionalActivationBudgetValidator(
    [
      new RegionalActivationBudgetSourceLengthRule(32),
      new RegionalActivationBudgetSendAtRangeRule(3600, 86400),
      new RegionalActivationBudgetNameLengthRule(16),
      new RegionalActivationBudgetVisibleGuardRule(80),
      new RegionalActivationBudgetCodeLengthRule(64),
      new RegionalActivationBudgetRequiredNameRule("regional activation budget needs a value"),
    ],
  );
}
