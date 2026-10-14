import { ModelException } from "./model-exception.js";

/** A rule a model exception must pass. Check returns its problems, or none. */
export interface ModelExceptionRule {
  check(item: ModelException): string[];
}

export class ModelExceptionEndsAtRangeRule implements ModelExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ModelException): string[] {
    const value = item.endsAt;
    if (value < this.min || value > this.max) return [`ends at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ModelExceptionRequiredNameRule implements ModelExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ModelException): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class ModelExceptionFrequencyCapRangeRule implements ModelExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ModelException): string[] {
    const value = item.frequencyCap;
    if (value < this.min || value > this.max) return [`frequency cap ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ModelExceptionNameLengthRule implements ModelExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ModelException): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ModelExceptionSendAtRangeRule implements ModelExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ModelException): string[] {
    const value = item.sendAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`send at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`send at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ModelExceptionImpressionsRangeRule implements ModelExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ModelException): string[] {
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

/** Runs every rule of a model exception. */
export class ModelExceptionValidator {
  rules: ModelExceptionRule[];

  constructor(rules: ModelExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: ModelException): string[] {
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

  requireValid(item: ModelException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ModelException[]): Map<string, string[]> {
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

export function defaultModelExceptionValidator(): ModelExceptionValidator {
  return new ModelExceptionValidator(
    [
      new ModelExceptionEndsAtRangeRule(32, 120),
      new ModelExceptionRequiredNameRule("model exception needs this field"),
      new ModelExceptionFrequencyCapRangeRule(255, 255),
      new ModelExceptionNameLengthRule(32),
      new ModelExceptionSendAtRangeRule(80, 86400),
      new ModelExceptionImpressionsRangeRule(80, 80),
    ],
  );
}
