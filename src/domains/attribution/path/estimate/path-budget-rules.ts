import { PathBudget } from "./path-budget.js";

/** A rule a path budget must pass. Check returns its problems, or none. */
export interface PathBudgetRule {
  check(item: PathBudget): string[];
}

export class PathBudgetRequiredDescriptionRule implements PathBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PathBudget): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

export class PathBudgetStartsAtRangeRule implements PathBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PathBudget): string[] {
    const value = item.startsAt;
    if (value < this.min || value > this.max) return [`starts at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PathBudgetRequiredAudienceIdRule implements PathBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PathBudget): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

export class PathBudgetMaximumRangeRule implements PathBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PathBudget): string[] {
    const value = item.maximum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`maximum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`maximum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PathBudgetCodePrefixRule implements PathBudgetRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PathBudget): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PathBudgetRequiredCodeRule implements PathBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PathBudget): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a path budget. */
export class PathBudgetValidator {
  rules: PathBudgetRule[];

  constructor(rules: PathBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: PathBudget): string[] {
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

  requireValid(item: PathBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PathBudget[]): Map<string, string[]> {
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

export function defaultPathBudgetValidator(): PathBudgetValidator {
  return new PathBudgetValidator(
    [
      new PathBudgetRequiredDescriptionRule("path budget needs this field"),
      new PathBudgetStartsAtRangeRule(255, 1000),
      new PathBudgetRequiredAudienceIdRule("path budget needs this field"),
      new PathBudgetMaximumRangeRule(8.8, 3727.7),
      new PathBudgetCodePrefixRule("Q"),
      new PathBudgetRequiredCodeRule("path budget needs an entry"),
    ],
  );
}
