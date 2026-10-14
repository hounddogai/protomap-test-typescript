import { GlobalBounceSummary } from "./global-bounce-summary.js";

/** A rule a global bounce summary must pass. Check returns its problems, or none. */
export interface GlobalBounceSummaryRule {
  check(item: GlobalBounceSummary): string[];
}

export class GlobalBounceSummaryFloorValueRangeRule implements GlobalBounceSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalBounceSummary): string[] {
    const value = item.floorValue;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`floor value ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`floor value ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class GlobalBounceSummaryRatioRangeRule implements GlobalBounceSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalBounceSummary): string[] {
    const value = item.ratio;
    if (value < this.min || value > this.max) return [`ratio ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class GlobalBounceSummaryCohortLengthRule implements GlobalBounceSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalBounceSummary): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalBounceSummaryNameLengthRule implements GlobalBounceSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalBounceSummary): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a global bounce summary. */
export class GlobalBounceSummaryValidator {
  rules: GlobalBounceSummaryRule[];

  constructor(rules: GlobalBounceSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalBounceSummary): string[] {
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

  requireValid(item: GlobalBounceSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalBounceSummary[]): Map<string, string[]> {
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

export function defaultGlobalBounceSummaryValidator(): GlobalBounceSummaryValidator {
  return new GlobalBounceSummaryValidator(
    [
      new GlobalBounceSummaryFloorValueRangeRule(8.3, 228.9),
      new GlobalBounceSummaryRatioRangeRule(7.2, 171.8),
      new GlobalBounceSummaryCohortLengthRule(16),
      new GlobalBounceSummaryNameLengthRule(1000),
    ],
  );
}
