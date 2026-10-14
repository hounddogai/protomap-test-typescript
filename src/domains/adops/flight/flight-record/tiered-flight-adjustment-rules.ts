import * as text from "../../../../kit/text.js";
import { TieredFlightAdjustment } from "./tiered-flight-adjustment.js";

/** A rule a tiered flight adjustment must pass. Check returns its problems, or none. */
export interface TieredFlightAdjustmentRule {
  check(item: TieredFlightAdjustment): string[];
}

export class TieredFlightAdjustmentWindowDaysRangeRule implements TieredFlightAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredFlightAdjustment): string[] {
    const value = item.windowDays;
    if (value < this.min || value > this.max) return [`window days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredFlightAdjustmentRequiredReviewerRule implements TieredFlightAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredFlightAdjustment): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class TieredFlightAdjustmentAllowedTitleRule implements TieredFlightAdjustmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TieredFlightAdjustment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is above maximum`];
    return [];
  }
}

/** Runs every rule of a tiered flight adjustment. */
export class TieredFlightAdjustmentValidator {
  rules: TieredFlightAdjustmentRule[];

  constructor(rules: TieredFlightAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: TieredFlightAdjustment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredFlightAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredFlightAdjustment[]): Map<string, string[]> {
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

export function defaultTieredFlightAdjustmentValidator(): TieredFlightAdjustmentValidator {
  return new TieredFlightAdjustmentValidator(
    [
      new TieredFlightAdjustmentWindowDaysRangeRule(16, 86400),
      new TieredFlightAdjustmentRequiredReviewerRule("tiered flight adjustment needs a value"),
      new TieredFlightAdjustmentAllowedTitleRule(["rolling", "manual", "scheduled"]),
    ],
  );
}
