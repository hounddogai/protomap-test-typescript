import { ManualCreativeSummary } from "./manual-creative-summary.js";

/** A rule a manual creative summary must pass. Check returns its problems, or none. */
export interface ManualCreativeSummaryRule {
  check(item: ManualCreativeSummary): string[];
}

export class ManualCreativeSummaryImpressionsRangeRule implements ManualCreativeSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualCreativeSummary): string[] {
    const value = item.impressions;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`impressions ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`impressions ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ManualCreativeSummaryBidRangeRule implements ManualCreativeSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualCreativeSummary): string[] {
    const value = item.bid;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`bid ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`bid ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ManualCreativeSummaryCodeLengthRule implements ManualCreativeSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualCreativeSummary): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualCreativeSummaryRequiredTitleRule implements ManualCreativeSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualCreativeSummary): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class ManualCreativeSummaryCategoryLengthRule implements ManualCreativeSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualCreativeSummary): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualCreativeSummaryNameLengthRule implements ManualCreativeSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualCreativeSummary): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a manual creative summary. */
export class ManualCreativeSummaryValidator {
  rules: ManualCreativeSummaryRule[];

  constructor(rules: ManualCreativeSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: ManualCreativeSummary): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualCreativeSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualCreativeSummary[]): Map<string, string[]> {
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

export function defaultManualCreativeSummaryValidator(): ManualCreativeSummaryValidator {
  return new ManualCreativeSummaryValidator(
    [
      new ManualCreativeSummaryImpressionsRangeRule(32, 3600),
      new ManualCreativeSummaryBidRangeRule(8.7, 3351.1),
      new ManualCreativeSummaryCodeLengthRule(80),
      new ManualCreativeSummaryRequiredTitleRule("manual creative summary needs this field"),
      new ManualCreativeSummaryCategoryLengthRule(3600),
      new ManualCreativeSummaryNameLengthRule(16),
    ],
  );
}
