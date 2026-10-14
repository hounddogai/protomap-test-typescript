import { ModelGroup } from "./model-group.js";

/** A rule a model group must pass. Check returns its problems, or none. */
export interface ModelGroupRule {
  check(item: ModelGroup): string[];
}

export class ModelGroupThresholdRangeRule implements ModelGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ModelGroup): string[] {
    const value = item.threshold;
    if (value < this.min || value > this.max) return [`threshold ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ModelGroupLimitRangeRule implements ModelGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ModelGroup): string[] {
    const value = item.limit;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`limit ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`limit ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ModelGroupRequiredCodeRule implements ModelGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ModelGroup): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a model group. */
export class ModelGroupValidator {
  rules: ModelGroupRule[];

  constructor(rules: ModelGroupRule[]) {
    this.rules = rules;
  }

  validate(item: ModelGroup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ModelGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ModelGroup[]): Map<string, string[]> {
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

export function defaultModelGroupValidator(): ModelGroupValidator {
  return new ModelGroupValidator(
    [
      new ModelGroupThresholdRangeRule(0, 4887.2),
      new ModelGroupLimitRangeRule(32, 64),
      new ModelGroupRequiredCodeRule("model group needs an entry"),
    ],
  );
}
