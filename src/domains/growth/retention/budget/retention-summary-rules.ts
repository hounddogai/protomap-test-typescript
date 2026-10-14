import { RetentionSummary } from "./retention-summary.js";

/** A rule a retention summary must pass. Check returns its problems, or none. */
export interface RetentionSummaryRule {
  check(item: RetentionSummary): string[];
}

export class RetentionSummaryBudgetRangeRule implements RetentionSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RetentionSummary): string[] {
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

export class RetentionSummaryRequiredCodeRule implements RetentionSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RetentionSummary): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RetentionSummaryRequiredNameRule implements RetentionSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RetentionSummary): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class RetentionSummaryRequiredLocaleRule implements RetentionSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RetentionSummary): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class RetentionSummaryLocaleLengthRule implements RetentionSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RetentionSummary): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a retention summary. */
export class RetentionSummaryValidator {
  rules: RetentionSummaryRule[];

  constructor(rules: RetentionSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: RetentionSummary): string[] {
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

  requireValid(item: RetentionSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RetentionSummary[]): Map<string, string[]> {
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

export function defaultRetentionSummaryValidator(): RetentionSummaryValidator {
  return new RetentionSummaryValidator(
    [
      new RetentionSummaryBudgetRangeRule(8.5, 869.9),
      new RetentionSummaryRequiredCodeRule("retention summary needs this field"),
      new RetentionSummaryRequiredNameRule("retention summary needs this field"),
      new RetentionSummaryRequiredLocaleRule("retention summary needs an entry"),
      new RetentionSummaryLocaleLengthRule(80),
    ],
  );
}
