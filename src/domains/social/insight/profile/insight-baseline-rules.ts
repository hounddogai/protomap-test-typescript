import { InsightBaseline } from "./insight-baseline.js";

/** A rule a insight baseline must pass. Check returns its problems, or none. */
export interface InsightBaselineRule {
  check(item: InsightBaseline): string[];
}

export class InsightBaselineRequiredReviewerRule implements InsightBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InsightBaseline): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class InsightBaselineRequiredCountryRule implements InsightBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InsightBaseline): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class InsightBaselineNameLengthRule implements InsightBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InsightBaseline): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class InsightBaselineReviewerLengthRule implements InsightBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InsightBaseline): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class InsightBaselineRequiredNameRule implements InsightBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InsightBaseline): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a insight baseline. */
export class InsightBaselineValidator {
  rules: InsightBaselineRule[];

  constructor(rules: InsightBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: InsightBaseline): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: InsightBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: InsightBaseline[]): Map<string, string[]> {
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

export function defaultInsightBaselineValidator(): InsightBaselineValidator {
  return new InsightBaselineValidator(
    [
      new InsightBaselineRequiredReviewerRule("insight baseline needs a value"),
      new InsightBaselineRequiredCountryRule("insight baseline needs this field"),
      new InsightBaselineNameLengthRule(120),
      new InsightBaselineReviewerLengthRule(16),
      new InsightBaselineRequiredNameRule("insight baseline needs this field"),
    ],
  );
}
