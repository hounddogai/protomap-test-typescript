import * as text from "../../../../kit/text.js";
import { DefaultPathAdjustment } from "./default-path-adjustment.js";

/** A rule a default path adjustment must pass. Check returns its problems, or none. */
export interface DefaultPathAdjustmentRule {
  check(item: DefaultPathAdjustment): string[];
}

export class DefaultPathAdjustmentStartsAtRangeRule implements DefaultPathAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultPathAdjustment): string[] {
    const value = item.startsAt;
    if (value < this.min || value > this.max) return [`starts at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DefaultPathAdjustmentRequiredCodeRule implements DefaultPathAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultPathAdjustment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultPathAdjustmentRequiredPhoneRule implements DefaultPathAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultPathAdjustment): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultPathAdjustmentRequiredTitleRule implements DefaultPathAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultPathAdjustment): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultPathAdjustmentAllowedCodeRule implements DefaultPathAdjustmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DefaultPathAdjustment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is blocked`];
    return [];
  }
}

export class DefaultPathAdjustmentGraceDaysRangeRule implements DefaultPathAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultPathAdjustment): string[] {
    const value = item.graceDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`grace days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`grace days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a default path adjustment. */
export class DefaultPathAdjustmentValidator {
  rules: DefaultPathAdjustmentRule[];

  constructor(rules: DefaultPathAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultPathAdjustment): string[] {
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

  requireValid(item: DefaultPathAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultPathAdjustment[]): Map<string, string[]> {
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

export function defaultDefaultPathAdjustmentValidator(): DefaultPathAdjustmentValidator {
  return new DefaultPathAdjustmentValidator(
    [
      new DefaultPathAdjustmentStartsAtRangeRule(64, 86400),
      new DefaultPathAdjustmentRequiredCodeRule("default path adjustment needs a value"),
      new DefaultPathAdjustmentRequiredPhoneRule("default path adjustment needs this field"),
      new DefaultPathAdjustmentRequiredTitleRule("default path adjustment needs this field"),
      new DefaultPathAdjustmentAllowedCodeRule(["weighted", "rolling", "scheduled"]),
      new DefaultPathAdjustmentGraceDaysRangeRule(16, 80),
    ],
  );
}
