import { ModelTarget } from "./model-target.js";

/** A rule a model target must pass. Check returns its problems, or none. */
export interface ModelTargetRule {
  check(item: ModelTarget): string[];
}

export class ModelTargetUpdatedAtRangeRule implements ModelTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ModelTarget): string[] {
    const value = item.updatedAt;
    if (value < this.min || value > this.max) return [`updated at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ModelTargetStartsAtRangeRule implements ModelTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ModelTarget): string[] {
    const value = item.startsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`starts at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`starts at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ModelTargetRequiredTitleRule implements ModelTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ModelTarget): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class ModelTargetMinimumRangeRule implements ModelTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ModelTarget): string[] {
    const value = item.minimum;
    if (value < this.min || value > this.max) return [`minimum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ModelTargetRequiredUtmSourceRule implements ModelTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ModelTarget): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

export class ModelTargetCodeLengthRule implements ModelTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ModelTarget): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a model target. */
export class ModelTargetValidator {
  rules: ModelTargetRule[];

  constructor(rules: ModelTargetRule[]) {
    this.rules = rules;
  }

  validate(item: ModelTarget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ModelTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ModelTarget[]): Map<string, string[]> {
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

export function defaultModelTargetValidator(): ModelTargetValidator {
  return new ModelTargetValidator(
    [
      new ModelTargetUpdatedAtRangeRule(32, 80),
      new ModelTargetStartsAtRangeRule(1000, 1000),
      new ModelTargetRequiredTitleRule("model target needs a value"),
      new ModelTargetMinimumRangeRule(3.3, 1386.4),
      new ModelTargetRequiredUtmSourceRule("model target needs this field"),
      new ModelTargetCodeLengthRule(16),
    ],
  );
}
