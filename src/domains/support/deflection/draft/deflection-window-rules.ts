import * as text from "../../../../kit/text.js";
import { DeflectionWindow } from "./deflection-window.js";

/** A rule a deflection window must pass. Check returns its problems, or none. */
export interface DeflectionWindowRule {
  check(item: DeflectionWindow): string[];
}

export class DeflectionWindowBudgetRangeRule implements DeflectionWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DeflectionWindow): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DeflectionWindowAllowedCodeRule implements DeflectionWindowRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DeflectionWindow): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is inconsistent`];
    return [];
  }
}

export class DeflectionWindowCodeLengthRule implements DeflectionWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DeflectionWindow): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DeflectionWindowMinimumRangeRule implements DeflectionWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DeflectionWindow): string[] {
    const value = item.minimum;
    if (value < this.min || value > this.max) return [`minimum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a deflection window. */
export class DeflectionWindowValidator {
  rules: DeflectionWindowRule[];

  constructor(rules: DeflectionWindowRule[]) {
    this.rules = rules;
  }

  validate(item: DeflectionWindow): string[] {
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

  requireValid(item: DeflectionWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DeflectionWindow[]): Map<string, string[]> {
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

export function defaultDeflectionWindowValidator(): DeflectionWindowValidator {
  return new DeflectionWindowValidator(
    [
      new DeflectionWindowBudgetRangeRule(9.5, 1442.1),
      new DeflectionWindowAllowedCodeRule(["primary", "tiered"]),
      new DeflectionWindowCodeLengthRule(64),
      new DeflectionWindowMinimumRangeRule(3.8, 1786.6),
    ],
  );
}
