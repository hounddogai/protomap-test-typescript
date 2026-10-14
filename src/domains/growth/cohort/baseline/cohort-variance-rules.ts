import { CohortVariance } from "./cohort-variance.js";

/** A rule a cohort variance must pass. Check returns its problems, or none. */
export interface CohortVarianceRule {
  check(item: CohortVariance): string[];
}

export class CohortVarianceTitleLengthRule implements CohortVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CohortVariance): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CohortVarianceRequiredTitleRule implements CohortVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CohortVariance): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class CohortVarianceBudgetRangeRule implements CohortVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CohortVariance): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CohortVarianceRequiredLabelRule implements CohortVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CohortVariance): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class CohortVarianceCodePrefixRule implements CohortVarianceRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CohortVariance): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a cohort variance. */
export class CohortVarianceValidator {
  rules: CohortVarianceRule[];

  constructor(rules: CohortVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: CohortVariance): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CohortVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CohortVariance[]): Map<string, string[]> {
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

export function defaultCohortVarianceValidator(): CohortVarianceValidator {
  return new CohortVarianceValidator(
    [
      new CohortVarianceTitleLengthRule(80),
      new CohortVarianceRequiredTitleRule("cohort variance needs an entry"),
      new CohortVarianceBudgetRangeRule(9, 4517.2),
      new CohortVarianceRequiredLabelRule("cohort variance needs a value"),
      new CohortVarianceCodePrefixRule("REF"),
    ],
  );
}
