import { ModelRollup } from "./model-rollup.js";

/** A rule a model rollup must pass. Check returns its problems, or none. */
export interface ModelRollupRule {
  check(item: ModelRollup): string[];
}

export class ModelRollupRateRangeRule implements ModelRollupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ModelRollup): string[] {
    const value = item.rate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ModelRollupCodeLengthRule implements ModelRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ModelRollup): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ModelRollupLabelLengthRule implements ModelRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ModelRollup): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a model rollup. */
export class ModelRollupValidator {
  rules: ModelRollupRule[];

  constructor(rules: ModelRollupRule[]) {
    this.rules = rules;
  }

  validate(item: ModelRollup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ModelRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ModelRollup[]): Map<string, string[]> {
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

export function defaultModelRollupValidator(): ModelRollupValidator {
  return new ModelRollupValidator(
    [
      new ModelRollupRateRangeRule(8.5, 2175.9),
      new ModelRollupCodeLengthRule(16),
      new ModelRollupLabelLengthRule(64),
    ],
  );
}
