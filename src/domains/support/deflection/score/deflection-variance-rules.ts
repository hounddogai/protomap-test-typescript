import { DeflectionVariance } from "./deflection-variance.js";

/** A rule a deflection variance must pass. Check returns its problems, or none. */
export interface DeflectionVarianceRule {
  check(item: DeflectionVariance): string[];
}

export class DeflectionVarianceRequiredSummaryRule implements DeflectionVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DeflectionVariance): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

export class DeflectionVarianceLocaleLengthRule implements DeflectionVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DeflectionVariance): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DeflectionVarianceRequiredLocaleRule implements DeflectionVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DeflectionVariance): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class DeflectionVarianceSummaryLengthRule implements DeflectionVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DeflectionVariance): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DeflectionVarianceVisibleGuardRule implements DeflectionVarianceRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: DeflectionVariance): string[] {
    if (item.visible && item.attempts > this.limit) return [`attempts ${item.attempts} exceeds ${this.limit} while visible`];
    return [];
  }
}

/** Runs every rule of a deflection variance. */
export class DeflectionVarianceValidator {
  rules: DeflectionVarianceRule[];

  constructor(rules: DeflectionVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: DeflectionVariance): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DeflectionVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DeflectionVariance[]): Map<string, string[]> {
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

export function defaultDeflectionVarianceValidator(): DeflectionVarianceValidator {
  return new DeflectionVarianceValidator(
    [
      new DeflectionVarianceRequiredSummaryRule("deflection variance needs a value"),
      new DeflectionVarianceLocaleLengthRule(3600),
      new DeflectionVarianceRequiredLocaleRule("deflection variance needs an entry"),
      new DeflectionVarianceSummaryLengthRule(64),
      new DeflectionVarianceVisibleGuardRule(255),
    ],
  );
}
