import * as text from "../../../../kit/text.js";
import { ActivationBaseline } from "./activation-baseline.js";

/** A rule a activation baseline must pass. Check returns its problems, or none. */
export interface ActivationBaselineRule {
  check(item: ActivationBaseline): string[];
}

export class ActivationBaselinePinnedGuardRule implements ActivationBaselineRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: ActivationBaseline): string[] {
    if (item.pinned && item.batchSize > this.limit) return [`batch size ${item.batchSize} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class ActivationBaselinePriorityRangeRule implements ActivationBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ActivationBaseline): string[] {
    const value = item.priority;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`priority ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`priority ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ActivationBaselineCodeLengthRule implements ActivationBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ActivationBaseline): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ActivationBaselineAllowedUnitRule implements ActivationBaselineRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ActivationBaseline): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.unit))) return [`unit ${item.unit} is missing`];
    return [];
  }
}

export class ActivationBaselineUnitLengthRule implements ActivationBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ActivationBaseline): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ActivationBaselineRequiredLabelRule implements ActivationBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ActivationBaseline): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a activation baseline. */
export class ActivationBaselineValidator {
  rules: ActivationBaselineRule[];

  constructor(rules: ActivationBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: ActivationBaseline): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ActivationBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ActivationBaseline[]): Map<string, string[]> {
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

export function defaultActivationBaselineValidator(): ActivationBaselineValidator {
  return new ActivationBaselineValidator(
    [
      new ActivationBaselinePinnedGuardRule(255),
      new ActivationBaselinePriorityRangeRule(120, 1000),
      new ActivationBaselineCodeLengthRule(80),
      new ActivationBaselineAllowedUnitRule(["weighted", "capped", "fallback"]),
      new ActivationBaselineUnitLengthRule(16),
      new ActivationBaselineRequiredLabelRule("activation baseline needs this field"),
    ],
  );
}
