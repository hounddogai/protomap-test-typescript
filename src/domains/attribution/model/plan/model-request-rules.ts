import { ModelRequest } from "./model-request.js";

/** A rule a model request must pass. Check returns its problems, or none. */
export interface ModelRequestRule {
  check(item: ModelRequest): string[];
}

export class ModelRequestRequiredLabelRule implements ModelRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ModelRequest): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class ModelRequestConversionRateRangeRule implements ModelRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ModelRequest): string[] {
    const value = item.conversionRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`conversion rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`conversion rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ModelRequestThresholdRangeRule implements ModelRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ModelRequest): string[] {
    const value = item.threshold;
    if (value < this.min || value > this.max) return [`threshold ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ModelRequestAmountRangeRule implements ModelRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ModelRequest): string[] {
    const value = item.amount;
    if (value < this.min || value > this.max) return [`amount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a model request. */
export class ModelRequestValidator {
  rules: ModelRequestRule[];

  constructor(rules: ModelRequestRule[]) {
    this.rules = rules;
  }

  validate(item: ModelRequest): string[] {
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

  requireValid(item: ModelRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ModelRequest[]): Map<string, string[]> {
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

export function defaultModelRequestValidator(): ModelRequestValidator {
  return new ModelRequestValidator(
    [
      new ModelRequestRequiredLabelRule("model request needs a value"),
      new ModelRequestConversionRateRangeRule(8, 4150.1),
      new ModelRequestThresholdRangeRule(9.3, 3374.7),
      new ModelRequestAmountRangeRule(5.8, 798.3),
    ],
  );
}
