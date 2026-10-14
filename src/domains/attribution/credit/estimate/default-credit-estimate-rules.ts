import { DefaultCreditEstimate } from "./default-credit-estimate.js";

/** A rule a default credit estimate must pass. Check returns its problems, or none. */
export interface DefaultCreditEstimateRule {
  check(item: DefaultCreditEstimate): string[];
}

export class DefaultCreditEstimateRequiredSummaryRule implements DefaultCreditEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultCreditEstimate): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultCreditEstimateRequiredNameRule implements DefaultCreditEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultCreditEstimate): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultCreditEstimateCategoryLengthRule implements DefaultCreditEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultCreditEstimate): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a default credit estimate. */
export class DefaultCreditEstimateValidator {
  rules: DefaultCreditEstimateRule[];

  constructor(rules: DefaultCreditEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultCreditEstimate): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DefaultCreditEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultCreditEstimate[]): Map<string, string[]> {
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

export function defaultDefaultCreditEstimateValidator(): DefaultCreditEstimateValidator {
  return new DefaultCreditEstimateValidator(
    [
      new DefaultCreditEstimateRequiredSummaryRule("default credit estimate needs a value"),
      new DefaultCreditEstimateRequiredNameRule("default credit estimate needs a value"),
      new DefaultCreditEstimateCategoryLengthRule(16),
    ],
  );
}
