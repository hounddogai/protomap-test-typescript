import { ModelRecord } from "./model-record.js";

/** A rule a model record must pass. Check returns its problems, or none. */
export interface ModelRecordRule {
  check(item: ModelRecord): string[];
}

export class ModelRecordRequiredCodeRule implements ModelRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ModelRecord): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ModelRecordMaximumRangeRule implements ModelRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ModelRecord): string[] {
    const value = item.maximum;
    if (value < this.min || value > this.max) return [`maximum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ModelRecordUnitLengthRule implements ModelRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ModelRecord): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ModelRecordRequiredUnitRule implements ModelRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ModelRecord): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a model record. */
export class ModelRecordValidator {
  rules: ModelRecordRule[];

  constructor(rules: ModelRecordRule[]) {
    this.rules = rules;
  }

  validate(item: ModelRecord): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ModelRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ModelRecord[]): Map<string, string[]> {
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

export function defaultModelRecordValidator(): ModelRecordValidator {
  return new ModelRecordValidator(
    [
      new ModelRecordRequiredCodeRule("model record needs this field"),
      new ModelRecordMaximumRangeRule(0.6, 141.8),
      new ModelRecordUnitLengthRule(80),
      new ModelRecordRequiredUnitRule("model record needs this field"),
    ],
  );
}
