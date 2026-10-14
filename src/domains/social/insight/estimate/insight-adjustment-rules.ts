import { InsightAdjustment } from "./insight-adjustment.js";

/** A rule a insight adjustment must pass. Check returns its problems, or none. */
export interface InsightAdjustmentRule {
  check(item: InsightAdjustment): string[];
}

export class InsightAdjustmentTitleLengthRule implements InsightAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InsightAdjustment): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class InsightAdjustmentMinimumRangeRule implements InsightAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: InsightAdjustment): string[] {
    const value = item.minimum;
    if (value < this.min || value > this.max) return [`minimum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class InsightAdjustmentCodeLengthRule implements InsightAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InsightAdjustment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class InsightAdjustmentCodePrefixRule implements InsightAdjustmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: InsightAdjustment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class InsightAdjustmentNotesLengthRule implements InsightAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InsightAdjustment): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class InsightAdjustmentThresholdRangeRule implements InsightAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: InsightAdjustment): string[] {
    const value = item.threshold;
    if (value < this.min || value > this.max) return [`threshold ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a insight adjustment. */
export class InsightAdjustmentValidator {
  rules: InsightAdjustmentRule[];

  constructor(rules: InsightAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: InsightAdjustment): string[] {
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

  requireValid(item: InsightAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: InsightAdjustment[]): Map<string, string[]> {
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

export function defaultInsightAdjustmentValidator(): InsightAdjustmentValidator {
  return new InsightAdjustmentValidator(
    [
      new InsightAdjustmentTitleLengthRule(32),
      new InsightAdjustmentMinimumRangeRule(9.1, 3430.3),
      new InsightAdjustmentCodeLengthRule(1000),
      new InsightAdjustmentCodePrefixRule("ACM"),
      new InsightAdjustmentNotesLengthRule(80),
      new InsightAdjustmentThresholdRangeRule(1.3, 3236.4),
    ],
  );
}
