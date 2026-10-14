import { PrimaryPacingMetric } from "./primary-pacing-metric.js";

/** A rule a primary pacing metric must pass. Check returns its problems, or none. */
export interface PrimaryPacingMetricRule {
  check(item: PrimaryPacingMetric): string[];
}

export class PrimaryPacingMetricCodeLengthRule implements PrimaryPacingMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryPacingMetric): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryPacingMetricRatioRangeRule implements PrimaryPacingMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryPacingMetric): string[] {
    const value = item.ratio;
    if (value < this.min || value > this.max) return [`ratio ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PrimaryPacingMetricRateRangeRule implements PrimaryPacingMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryPacingMetric): string[] {
    const value = item.rate;
    if (value < this.min || value > this.max) return [`rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PrimaryPacingMetricRequiredCodeRule implements PrimaryPacingMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryPacingMetric): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryPacingMetricRequiredNameRule implements PrimaryPacingMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryPacingMetric): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a primary pacing metric. */
export class PrimaryPacingMetricValidator {
  rules: PrimaryPacingMetricRule[];

  constructor(rules: PrimaryPacingMetricRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryPacingMetric): string[] {
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

  requireValid(item: PrimaryPacingMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryPacingMetric[]): Map<string, string[]> {
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

export function defaultPrimaryPacingMetricValidator(): PrimaryPacingMetricValidator {
  return new PrimaryPacingMetricValidator(
    [
      new PrimaryPacingMetricCodeLengthRule(16),
      new PrimaryPacingMetricRatioRangeRule(1.7, 3855.8),
      new PrimaryPacingMetricRateRangeRule(3.5, 3271),
      new PrimaryPacingMetricRequiredCodeRule("primary pacing metric needs this field"),
      new PrimaryPacingMetricRequiredNameRule("primary pacing metric needs a value"),
    ],
  );
}
