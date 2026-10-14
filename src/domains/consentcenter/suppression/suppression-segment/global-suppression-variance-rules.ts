import * as text from "../../../../kit/text.js";
import { GlobalSuppressionVariance } from "./global-suppression-variance.js";

/** A rule a global suppression variance must pass. Check returns its problems, or none. */
export interface GlobalSuppressionVarianceRule {
  check(item: GlobalSuppressionVariance): string[];
}

export class GlobalSuppressionVarianceRequiredCodeRule implements GlobalSuppressionVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalSuppressionVariance): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalSuppressionVarianceAllowedLabelRule implements GlobalSuppressionVarianceRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: GlobalSuppressionVariance): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is above maximum`];
    return [];
  }
}

export class GlobalSuppressionVarianceExpiresAtRangeRule implements GlobalSuppressionVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalSuppressionVariance): string[] {
    const value = item.expiresAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`expires at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`expires at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class GlobalSuppressionVarianceFloorValueRangeRule implements GlobalSuppressionVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalSuppressionVariance): string[] {
    const value = item.floorValue;
    if (value < this.min || value > this.max) return [`floor value ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class GlobalSuppressionVarianceCodeLengthRule implements GlobalSuppressionVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalSuppressionVariance): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a global suppression variance. */
export class GlobalSuppressionVarianceValidator {
  rules: GlobalSuppressionVarianceRule[];

  constructor(rules: GlobalSuppressionVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalSuppressionVariance): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalSuppressionVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalSuppressionVariance[]): Map<string, string[]> {
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

export function defaultGlobalSuppressionVarianceValidator(): GlobalSuppressionVarianceValidator {
  return new GlobalSuppressionVarianceValidator(
    [
      new GlobalSuppressionVarianceRequiredCodeRule("global suppression variance needs this field"),
      new GlobalSuppressionVarianceAllowedLabelRule(["regional", "rolling"]),
      new GlobalSuppressionVarianceExpiresAtRangeRule(80, 86400),
      new GlobalSuppressionVarianceFloorValueRangeRule(5.7, 2587.1),
      new GlobalSuppressionVarianceCodeLengthRule(255),
    ],
  );
}
