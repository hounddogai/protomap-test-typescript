import { InsightSummary } from "./insight-summary.js";

/** A rule a insight summary must pass. Check returns its problems, or none. */
export interface InsightSummaryRule {
  check(item: InsightSummary): string[];
}

export class InsightSummaryRequiredCodeRule implements InsightSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InsightSummary): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class InsightSummaryRequiredLabelRule implements InsightSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InsightSummary): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class InsightSummaryBatchSizeRangeRule implements InsightSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: InsightSummary): string[] {
    const value = item.batchSize;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`batch size ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`batch size ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class InsightSummaryCodeLengthRule implements InsightSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InsightSummary): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a insight summary. */
export class InsightSummaryValidator {
  rules: InsightSummaryRule[];

  constructor(rules: InsightSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: InsightSummary): string[] {
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

  requireValid(item: InsightSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: InsightSummary[]): Map<string, string[]> {
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

export function defaultInsightSummaryValidator(): InsightSummaryValidator {
  return new InsightSummaryValidator(
    [
      new InsightSummaryRequiredCodeRule("insight summary needs an entry"),
      new InsightSummaryRequiredLabelRule("insight summary needs a value"),
      new InsightSummaryBatchSizeRangeRule(16, 3600),
      new InsightSummaryCodeLengthRule(3600),
    ],
  );
}
