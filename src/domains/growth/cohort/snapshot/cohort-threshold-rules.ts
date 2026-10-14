import { CohortThreshold } from "./cohort-threshold.js";

/** A rule a cohort threshold must pass. Check returns its problems, or none. */
export interface CohortThresholdRule {
  check(item: CohortThreshold): string[];
}

export class CohortThresholdUnitLengthRule implements CohortThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CohortThreshold): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CohortThresholdClicksRangeRule implements CohortThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CohortThreshold): string[] {
    const value = item.clicks;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`clicks ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`clicks ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CohortThresholdLabelLengthRule implements CohortThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CohortThreshold): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CohortThresholdRequiredCodeRule implements CohortThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CohortThreshold): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CohortThresholdRequiredLabelRule implements CohortThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CohortThreshold): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class CohortThresholdSegmentLengthRule implements CohortThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CohortThreshold): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a cohort threshold. */
export class CohortThresholdValidator {
  rules: CohortThresholdRule[];

  constructor(rules: CohortThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: CohortThreshold): string[] {
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

  requireValid(item: CohortThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CohortThreshold[]): Map<string, string[]> {
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

export function defaultCohortThresholdValidator(): CohortThresholdValidator {
  return new CohortThresholdValidator(
    [
      new CohortThresholdUnitLengthRule(16),
      new CohortThresholdClicksRangeRule(80, 3600),
      new CohortThresholdLabelLengthRule(120),
      new CohortThresholdRequiredCodeRule("cohort threshold needs a value"),
      new CohortThresholdRequiredLabelRule("cohort threshold needs an entry"),
      new CohortThresholdSegmentLengthRule(64),
    ],
  );
}
