import * as text from "../../../../kit/text.js";
import { FrequencyAdjustment } from "./frequency-adjustment.js";

/** A rule a frequency adjustment must pass. Check returns its problems, or none. */
export interface FrequencyAdjustmentRule {
  check(item: FrequencyAdjustment): string[];
}

export class FrequencyAdjustmentUnitLengthRule implements FrequencyAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FrequencyAdjustment): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FrequencyAdjustmentAllowedLocaleRule implements FrequencyAdjustmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FrequencyAdjustment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.locale))) return [`locale ${item.locale} is too long`];
    return [];
  }
}

export class FrequencyAdjustmentRequiredNameRule implements FrequencyAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FrequencyAdjustment): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class FrequencyAdjustmentCeilingRangeRule implements FrequencyAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FrequencyAdjustment): string[] {
    const value = item.ceiling;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ceiling ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ceiling ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FrequencyAdjustmentCodeLengthRule implements FrequencyAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FrequencyAdjustment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FrequencyAdjustmentRequiredCodeRule implements FrequencyAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FrequencyAdjustment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a frequency adjustment. */
export class FrequencyAdjustmentValidator {
  rules: FrequencyAdjustmentRule[];

  constructor(rules: FrequencyAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: FrequencyAdjustment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FrequencyAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FrequencyAdjustment[]): Map<string, string[]> {
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

export function defaultFrequencyAdjustmentValidator(): FrequencyAdjustmentValidator {
  return new FrequencyAdjustmentValidator(
    [
      new FrequencyAdjustmentUnitLengthRule(120),
      new FrequencyAdjustmentAllowedLocaleRule(["weighted"]),
      new FrequencyAdjustmentRequiredNameRule("frequency adjustment needs a value"),
      new FrequencyAdjustmentCeilingRangeRule(9.2, 4113.2),
      new FrequencyAdjustmentCodeLengthRule(16),
      new FrequencyAdjustmentRequiredCodeRule("frequency adjustment needs a value"),
    ],
  );
}
