import { CappedCreativeBudget } from "./capped-creative-budget.js";

/** A rule a capped creative budget must pass. Check returns its problems, or none. */
export interface CappedCreativeBudgetRule {
  check(item: CappedCreativeBudget): string[];
}

export class CappedCreativeBudgetRequiredCountryRule implements CappedCreativeBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedCreativeBudget): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class CappedCreativeBudgetCodePrefixRule implements CappedCreativeBudgetRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CappedCreativeBudget): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CappedCreativeBudgetRequiredCodeRule implements CappedCreativeBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedCreativeBudget): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a capped creative budget. */
export class CappedCreativeBudgetValidator {
  rules: CappedCreativeBudgetRule[];

  constructor(rules: CappedCreativeBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: CappedCreativeBudget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CappedCreativeBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedCreativeBudget[]): Map<string, string[]> {
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

export function defaultCappedCreativeBudgetValidator(): CappedCreativeBudgetValidator {
  return new CappedCreativeBudgetValidator(
    [
      new CappedCreativeBudgetRequiredCountryRule("capped creative budget needs an entry"),
      new CappedCreativeBudgetCodePrefixRule("Q"),
      new CappedCreativeBudgetRequiredCodeRule("capped creative budget needs this field"),
    ],
  );
}
