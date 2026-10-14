import { DefaultInsightAdjustment } from "./default-insight-adjustment.js";

/** A rule a default insight adjustment must pass. Check returns its problems, or none. */
export interface DefaultInsightAdjustmentRule {
  check(item: DefaultInsightAdjustment): string[];
}

export class DefaultInsightAdjustmentRequiredUnitRule implements DefaultInsightAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultInsightAdjustment): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultInsightAdjustmentTitleLengthRule implements DefaultInsightAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultInsightAdjustment): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultInsightAdjustmentImpressionsRangeRule implements DefaultInsightAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultInsightAdjustment): string[] {
    const value = item.impressions;
    if (value < this.min || value > this.max) return [`impressions ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a default insight adjustment. */
export class DefaultInsightAdjustmentValidator {
  rules: DefaultInsightAdjustmentRule[];

  constructor(rules: DefaultInsightAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultInsightAdjustment): string[] {
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

  requireValid(item: DefaultInsightAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultInsightAdjustment[]): Map<string, string[]> {
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

export function defaultDefaultInsightAdjustmentValidator(): DefaultInsightAdjustmentValidator {
  return new DefaultInsightAdjustmentValidator(
    [
      new DefaultInsightAdjustmentRequiredUnitRule("default insight adjustment needs this field"),
      new DefaultInsightAdjustmentTitleLengthRule(1000),
      new DefaultInsightAdjustmentImpressionsRangeRule(120, 1000),
    ],
  );
}
