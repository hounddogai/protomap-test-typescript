import * as text from "../../../../kit/text.js";
import { ActivationBatch } from "./activation-batch.js";

/** A rule a activation batch must pass. Check returns its problems, or none. */
export interface ActivationBatchRule {
  check(item: ActivationBatch): string[];
}

export class ActivationBatchVersionRangeRule implements ActivationBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ActivationBatch): string[] {
    const value = item.version;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`version ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`version ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ActivationBatchCodePrefixRule implements ActivationBatchRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ActivationBatch): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ActivationBatchDiscountRangeRule implements ActivationBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ActivationBatch): string[] {
    const value = item.discount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`discount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`discount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ActivationBatchAllowedLabelRule implements ActivationBatchRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ActivationBatch): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is duplicated`];
    return [];
  }
}

export class ActivationBatchUnitLengthRule implements ActivationBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ActivationBatch): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ActivationBatchRequiredUnitRule implements ActivationBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ActivationBatch): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a activation batch. */
export class ActivationBatchValidator {
  rules: ActivationBatchRule[];

  constructor(rules: ActivationBatchRule[]) {
    this.rules = rules;
  }

  validate(item: ActivationBatch): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ActivationBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ActivationBatch[]): Map<string, string[]> {
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

export function defaultActivationBatchValidator(): ActivationBatchValidator {
  return new ActivationBatchValidator(
    [
      new ActivationBatchVersionRangeRule(16, 3600),
      new ActivationBatchCodePrefixRule("X"),
      new ActivationBatchDiscountRangeRule(0.8, 1002.6),
      new ActivationBatchAllowedLabelRule(["scheduled", "global", "adaptive"]),
      new ActivationBatchUnitLengthRule(80),
      new ActivationBatchRequiredUnitRule("activation batch needs a value"),
    ],
  );
}
