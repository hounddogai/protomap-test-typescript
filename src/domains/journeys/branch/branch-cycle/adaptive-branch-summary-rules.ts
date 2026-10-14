import { AdaptiveBranchSummary } from "./adaptive-branch-summary.js";

/** A rule a adaptive branch summary must pass. Check returns its problems, or none. */
export interface AdaptiveBranchSummaryRule {
  check(item: AdaptiveBranchSummary): string[];
}

export class AdaptiveBranchSummaryWindowDaysRangeRule implements AdaptiveBranchSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveBranchSummary): string[] {
    const value = item.windowDays;
    if (value < this.min || value > this.max) return [`window days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class AdaptiveBranchSummaryLabelLengthRule implements AdaptiveBranchSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveBranchSummary): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveBranchSummaryRequiredLabelRule implements AdaptiveBranchSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveBranchSummary): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a adaptive branch summary. */
export class AdaptiveBranchSummaryValidator {
  rules: AdaptiveBranchSummaryRule[];

  constructor(rules: AdaptiveBranchSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveBranchSummary): string[] {
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

  requireValid(item: AdaptiveBranchSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveBranchSummary[]): Map<string, string[]> {
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

export function defaultAdaptiveBranchSummaryValidator(): AdaptiveBranchSummaryValidator {
  return new AdaptiveBranchSummaryValidator(
    [
      new AdaptiveBranchSummaryWindowDaysRangeRule(120, 86400),
      new AdaptiveBranchSummaryLabelLengthRule(32),
      new AdaptiveBranchSummaryRequiredLabelRule("adaptive branch summary needs an entry"),
    ],
  );
}
