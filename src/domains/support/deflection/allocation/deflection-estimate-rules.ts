import * as text from "../../../../kit/text.js";
import { DeflectionEstimate } from "./deflection-estimate.js";

/** A rule a deflection estimate must pass. Check returns its problems, or none. */
export interface DeflectionEstimateRule {
  check(item: DeflectionEstimate): string[];
}

export class DeflectionEstimateCodeLengthRule implements DeflectionEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DeflectionEstimate): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DeflectionEstimateRequiredLabelRule implements DeflectionEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DeflectionEstimate): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class DeflectionEstimateRequiredCodeRule implements DeflectionEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DeflectionEstimate): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class DeflectionEstimateVisibleGuardRule implements DeflectionEstimateRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: DeflectionEstimate): string[] {
    if (item.visible && item.retries > this.limit) return [`retries ${item.retries} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class DeflectionEstimateTitleLengthRule implements DeflectionEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DeflectionEstimate): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DeflectionEstimateAllowedLabelRule implements DeflectionEstimateRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DeflectionEstimate): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is above maximum`];
    return [];
  }
}

/** Runs every rule of a deflection estimate. */
export class DeflectionEstimateValidator {
  rules: DeflectionEstimateRule[];

  constructor(rules: DeflectionEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: DeflectionEstimate): string[] {
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

  requireValid(item: DeflectionEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DeflectionEstimate[]): Map<string, string[]> {
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

export function defaultDeflectionEstimateValidator(): DeflectionEstimateValidator {
  return new DeflectionEstimateValidator(
    [
      new DeflectionEstimateCodeLengthRule(255),
      new DeflectionEstimateRequiredLabelRule("deflection estimate needs an entry"),
      new DeflectionEstimateRequiredCodeRule("deflection estimate needs a value"),
      new DeflectionEstimateVisibleGuardRule(3600),
      new DeflectionEstimateTitleLengthRule(16),
      new DeflectionEstimateAllowedLabelRule([]),
    ],
  );
}
