import { ModelMetric } from "./model-metric.js";

/** A rule a model metric must pass. Check returns its problems, or none. */
export interface ModelMetricRule {
  check(item: ModelMetric): string[];
}

export class ModelMetricCreatedAtRangeRule implements ModelMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ModelMetric): string[] {
    const value = item.createdAt;
    if (value < this.min || value > this.max) return [`created at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ModelMetricCodeLengthRule implements ModelMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ModelMetric): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ModelMetricRequiredLabelRule implements ModelMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ModelMetric): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class ModelMetricRequiredVariantRule implements ModelMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ModelMetric): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a model metric. */
export class ModelMetricValidator {
  rules: ModelMetricRule[];

  constructor(rules: ModelMetricRule[]) {
    this.rules = rules;
  }

  validate(item: ModelMetric): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ModelMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ModelMetric[]): Map<string, string[]> {
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

export function defaultModelMetricValidator(): ModelMetricValidator {
  return new ModelMetricValidator(
    [
      new ModelMetricCreatedAtRangeRule(32, 120),
      new ModelMetricCodeLengthRule(64),
      new ModelMetricRequiredLabelRule("model metric needs this field"),
      new ModelMetricRequiredVariantRule("model metric needs an entry"),
    ],
  );
}
