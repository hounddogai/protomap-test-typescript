import { ModelMapping } from "./model-mapping.js";

/** A rule a model mapping must pass. Check returns its problems, or none. */
export interface ModelMappingRule {
  check(item: ModelMapping): string[];
}

export class ModelMappingRequiredCohortRule implements ModelMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ModelMapping): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

export class ModelMappingRequiredLabelRule implements ModelMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ModelMapping): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class ModelMappingRequiredCategoryRule implements ModelMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ModelMapping): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

export class ModelMappingRatioRangeRule implements ModelMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ModelMapping): string[] {
    const value = item.ratio;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ratio ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ratio ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a model mapping. */
export class ModelMappingValidator {
  rules: ModelMappingRule[];

  constructor(rules: ModelMappingRule[]) {
    this.rules = rules;
  }

  validate(item: ModelMapping): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ModelMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ModelMapping[]): Map<string, string[]> {
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

export function defaultModelMappingValidator(): ModelMappingValidator {
  return new ModelMappingValidator(
    [
      new ModelMappingRequiredCohortRule("model mapping needs an entry"),
      new ModelMappingRequiredLabelRule("model mapping needs this field"),
      new ModelMappingRequiredCategoryRule("model mapping needs this field"),
      new ModelMappingRatioRangeRule(3.4, 654.2),
    ],
  );
}
