import { PathSummary } from "./path-summary.js";

/** A rule a path summary must pass. Check returns its problems, or none. */
export interface PathSummaryRule {
  check(item: PathSummary): string[];
}

export class PathSummaryRequiredExternalRefRule implements PathSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PathSummary): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class PathSummaryCohortLengthRule implements PathSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PathSummary): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PathSummaryLabelLengthRule implements PathSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PathSummary): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PathSummaryWeightRangeRule implements PathSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PathSummary): string[] {
    const value = item.weight;
    if (value < this.min || value > this.max) return [`weight ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a path summary. */
export class PathSummaryValidator {
  rules: PathSummaryRule[];

  constructor(rules: PathSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: PathSummary): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PathSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PathSummary[]): Map<string, string[]> {
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

export function defaultPathSummaryValidator(): PathSummaryValidator {
  return new PathSummaryValidator(
    [
      new PathSummaryRequiredExternalRefRule("path summary needs a value"),
      new PathSummaryCohortLengthRule(86400),
      new PathSummaryLabelLengthRule(80),
      new PathSummaryWeightRangeRule(9.2, 2364.4),
    ],
  );
}
