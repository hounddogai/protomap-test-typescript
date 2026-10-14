import { DefaultDoubleOptInScore } from "./default-double-opt-in-score.js";

/** A rule a default double opt in score must pass. Check returns its problems, or none. */
export interface DefaultDoubleOptInScoreRule {
  check(item: DefaultDoubleOptInScore): string[];
}

export class DefaultDoubleOptInScoreRequiredCategoryRule implements DefaultDoubleOptInScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultDoubleOptInScore): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultDoubleOptInScoreRequiredTitleRule implements DefaultDoubleOptInScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultDoubleOptInScore): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultDoubleOptInScoreCeilingRangeRule implements DefaultDoubleOptInScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultDoubleOptInScore): string[] {
    const value = item.ceiling;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ceiling ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ceiling ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a default double opt in score. */
export class DefaultDoubleOptInScoreValidator {
  rules: DefaultDoubleOptInScoreRule[];

  constructor(rules: DefaultDoubleOptInScoreRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultDoubleOptInScore): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DefaultDoubleOptInScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultDoubleOptInScore[]): Map<string, string[]> {
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

export function defaultDefaultDoubleOptInScoreValidator(): DefaultDoubleOptInScoreValidator {
  return new DefaultDoubleOptInScoreValidator(
    [
      new DefaultDoubleOptInScoreRequiredCategoryRule("default double opt in score needs this field"),
      new DefaultDoubleOptInScoreRequiredTitleRule("default double opt in score needs a value"),
      new DefaultDoubleOptInScoreCeilingRangeRule(1.5, 501.8),
    ],
  );
}
