import * as text from "../../../../kit/text.js";
import { ActivationVariance } from "./activation-variance.js";

/** A rule a activation variance must pass. Check returns its problems, or none. */
export interface ActivationVarianceRule {
  check(item: ActivationVariance): string[];
}

export class ActivationVarianceCostRangeRule implements ActivationVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ActivationVariance): string[] {
    const value = item.cost;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`cost ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`cost ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ActivationVarianceRequiredNameRule implements ActivationVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ActivationVariance): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class ActivationVarianceAllowedCodeRule implements ActivationVarianceRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ActivationVariance): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is blocked`];
    return [];
  }
}

export class ActivationVarianceNameLengthRule implements ActivationVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ActivationVariance): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ActivationVariancePhoneLengthRule implements ActivationVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ActivationVariance): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a activation variance. */
export class ActivationVarianceValidator {
  rules: ActivationVarianceRule[];

  constructor(rules: ActivationVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: ActivationVariance): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ActivationVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ActivationVariance[]): Map<string, string[]> {
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

export function defaultActivationVarianceValidator(): ActivationVarianceValidator {
  return new ActivationVarianceValidator(
    [
      new ActivationVarianceCostRangeRule(8, 3963.3),
      new ActivationVarianceRequiredNameRule("activation variance needs a value"),
      new ActivationVarianceAllowedCodeRule(["strict", "primary"]),
      new ActivationVarianceNameLengthRule(80),
      new ActivationVariancePhoneLengthRule(80),
    ],
  );
}
