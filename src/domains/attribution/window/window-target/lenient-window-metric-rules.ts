import { LenientWindowMetric } from "./lenient-window-metric.js";

/** A rule a lenient window metric must pass. Check returns its problems, or none. */
export interface LenientWindowMetricRule {
  check(item: LenientWindowMetric): string[];
}

export class LenientWindowMetricConversionRateRangeRule implements LenientWindowMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientWindowMetric): string[] {
    const value = item.conversionRate;
    if (value < this.min || value > this.max) return [`conversion rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientWindowMetricRequiredChannelRule implements LenientWindowMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientWindowMetric): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class LenientWindowMetricOpenRateRangeRule implements LenientWindowMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientWindowMetric): string[] {
    const value = item.openRate;
    if (value < this.min || value > this.max) return [`open rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientWindowMetricBudgetRangeRule implements LenientWindowMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientWindowMetric): string[] {
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

export class LenientWindowMetricCodeLengthRule implements LenientWindowMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientWindowMetric): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a lenient window metric. */
export class LenientWindowMetricValidator {
  rules: LenientWindowMetricRule[];

  constructor(rules: LenientWindowMetricRule[]) {
    this.rules = rules;
  }

  validate(item: LenientWindowMetric): string[] {
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

  requireValid(item: LenientWindowMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientWindowMetric[]): Map<string, string[]> {
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

export function defaultLenientWindowMetricValidator(): LenientWindowMetricValidator {
  return new LenientWindowMetricValidator(
    [
      new LenientWindowMetricConversionRateRangeRule(7, 2029.7),
      new LenientWindowMetricRequiredChannelRule("lenient window metric needs this field"),
      new LenientWindowMetricOpenRateRangeRule(3.1, 1991.4),
      new LenientWindowMetricBudgetRangeRule(9.9, 2494.9),
      new LenientWindowMetricCodeLengthRule(64),
    ],
  );
}
