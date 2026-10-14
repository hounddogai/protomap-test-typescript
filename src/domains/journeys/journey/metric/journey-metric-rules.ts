import { JourneyMetric } from "./journey-metric.js";

/** A rule a journey metric must pass. Check returns its problems, or none. */
export interface JourneyMetricRule {
  check(item: JourneyMetric): string[];
}

export class JourneyMetricImpressionsRangeRule implements JourneyMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: JourneyMetric): string[] {
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

export class JourneyMetricRequiredCodeRule implements JourneyMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: JourneyMetric): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class JourneyMetricNameLengthRule implements JourneyMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: JourneyMetric): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class JourneyMetricRequiredNameRule implements JourneyMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: JourneyMetric): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a journey metric. */
export class JourneyMetricValidator {
  rules: JourneyMetricRule[];

  constructor(rules: JourneyMetricRule[]) {
    this.rules = rules;
  }

  validate(item: JourneyMetric): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: JourneyMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: JourneyMetric[]): Map<string, string[]> {
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

export function defaultJourneyMetricValidator(): JourneyMetricValidator {
  return new JourneyMetricValidator(
    [
      new JourneyMetricImpressionsRangeRule(32, 64),
      new JourneyMetricRequiredCodeRule("journey metric needs this field"),
      new JourneyMetricNameLengthRule(86400),
      new JourneyMetricRequiredNameRule("journey metric needs this field"),
    ],
  );
}
