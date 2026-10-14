import { FallbackModelBudget } from "./fallback-model-budget.js";

/** A rule a fallback model budget must pass. Check returns its problems, or none. */
export interface FallbackModelBudgetRule {
  check(item: FallbackModelBudget): string[];
}

export class FallbackModelBudgetRequiredUtmSourceRule implements FallbackModelBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackModelBudget): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackModelBudgetCodeLengthRule implements FallbackModelBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackModelBudget): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackModelBudgetExternalRefLengthRule implements FallbackModelBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackModelBudget): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackModelBudgetApprovedGuardRule implements FallbackModelBudgetRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: FallbackModelBudget): string[] {
    if (item.approved && item.sequence > this.limit) return [`sequence ${item.sequence} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class FallbackModelBudgetRequiredCodeRule implements FallbackModelBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackModelBudget): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackModelBudgetLabelLengthRule implements FallbackModelBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackModelBudget): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a fallback model budget. */
export class FallbackModelBudgetValidator {
  rules: FallbackModelBudgetRule[];

  constructor(rules: FallbackModelBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackModelBudget): string[] {
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

  requireValid(item: FallbackModelBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackModelBudget[]): Map<string, string[]> {
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

export function defaultFallbackModelBudgetValidator(): FallbackModelBudgetValidator {
  return new FallbackModelBudgetValidator(
    [
      new FallbackModelBudgetRequiredUtmSourceRule("fallback model budget needs a value"),
      new FallbackModelBudgetCodeLengthRule(3600),
      new FallbackModelBudgetExternalRefLengthRule(16),
      new FallbackModelBudgetApprovedGuardRule(16),
      new FallbackModelBudgetRequiredCodeRule("fallback model budget needs a value"),
      new FallbackModelBudgetLabelLengthRule(3600),
    ],
  );
}
