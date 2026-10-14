import { ActivationThreshold } from "./activation-threshold.js";

/** A rule a activation threshold must pass. Check returns its problems, or none. */
export interface ActivationThresholdRule {
  check(item: ActivationThreshold): string[];
}

export class ActivationThresholdLabelLengthRule implements ActivationThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ActivationThreshold): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ActivationThresholdDiscountRangeRule implements ActivationThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ActivationThreshold): string[] {
    const value = item.discount;
    if (value < this.min || value > this.max) return [`discount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ActivationThresholdGraceDaysRangeRule implements ActivationThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ActivationThreshold): string[] {
    const value = item.graceDays;
    if (value < this.min || value > this.max) return [`grace days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ActivationThresholdMinimumRangeRule implements ActivationThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ActivationThreshold): string[] {
    const value = item.minimum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`minimum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`minimum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a activation threshold. */
export class ActivationThresholdValidator {
  rules: ActivationThresholdRule[];

  constructor(rules: ActivationThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: ActivationThreshold): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ActivationThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ActivationThreshold[]): Map<string, string[]> {
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

export function defaultActivationThresholdValidator(): ActivationThresholdValidator {
  return new ActivationThresholdValidator(
    [
      new ActivationThresholdLabelLengthRule(86400),
      new ActivationThresholdDiscountRangeRule(0.5, 285.3),
      new ActivationThresholdGraceDaysRangeRule(32, 1000),
      new ActivationThresholdMinimumRangeRule(4, 1004.8),
    ],
  );
}
