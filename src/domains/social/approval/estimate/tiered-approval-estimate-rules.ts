import { TieredApprovalEstimate } from "./tiered-approval-estimate.js";

/** A rule a tiered approval estimate must pass. Check returns its problems, or none. */
export interface TieredApprovalEstimateRule {
  check(item: TieredApprovalEstimate): string[];
}

export class TieredApprovalEstimateCodeLengthRule implements TieredApprovalEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredApprovalEstimate): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredApprovalEstimateGraceDaysRangeRule implements TieredApprovalEstimateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredApprovalEstimate): string[] {
    const value = item.graceDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`grace days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`grace days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TieredApprovalEstimateEndsAtRangeRule implements TieredApprovalEstimateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredApprovalEstimate): string[] {
    const value = item.endsAt;
    if (value < this.min || value > this.max) return [`ends at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredApprovalEstimateCodePrefixRule implements TieredApprovalEstimateRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TieredApprovalEstimate): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class TieredApprovalEstimateCategoryLengthRule implements TieredApprovalEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredApprovalEstimate): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredApprovalEstimateRequiredTitleRule implements TieredApprovalEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredApprovalEstimate): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a tiered approval estimate. */
export class TieredApprovalEstimateValidator {
  rules: TieredApprovalEstimateRule[];

  constructor(rules: TieredApprovalEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: TieredApprovalEstimate): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredApprovalEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredApprovalEstimate[]): Map<string, string[]> {
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

export function defaultTieredApprovalEstimateValidator(): TieredApprovalEstimateValidator {
  return new TieredApprovalEstimateValidator(
    [
      new TieredApprovalEstimateCodeLengthRule(1000),
      new TieredApprovalEstimateGraceDaysRangeRule(1000, 3600),
      new TieredApprovalEstimateEndsAtRangeRule(64, 1000),
      new TieredApprovalEstimateCodePrefixRule("REF"),
      new TieredApprovalEstimateCategoryLengthRule(32),
      new TieredApprovalEstimateRequiredTitleRule("tiered approval estimate needs an entry"),
    ],
  );
}
