import { TieredPlacementException } from "./tiered-placement-exception.js";

/** A rule a tiered placement exception must pass. Check returns its problems, or none. */
export interface TieredPlacementExceptionRule {
  check(item: TieredPlacementException): string[];
}

export class TieredPlacementExceptionLabelLengthRule implements TieredPlacementExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredPlacementException): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredPlacementExceptionSourceLengthRule implements TieredPlacementExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredPlacementException): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredPlacementExceptionPriorityRangeRule implements TieredPlacementExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredPlacementException): string[] {
    const value = item.priority;
    if (value < this.min || value > this.max) return [`priority ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredPlacementExceptionRequiredLabelRule implements TieredPlacementExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredPlacementException): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class TieredPlacementExceptionBudgetRangeRule implements TieredPlacementExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredPlacementException): string[] {
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

/** Runs every rule of a tiered placement exception. */
export class TieredPlacementExceptionValidator {
  rules: TieredPlacementExceptionRule[];

  constructor(rules: TieredPlacementExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: TieredPlacementException): string[] {
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

  requireValid(item: TieredPlacementException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredPlacementException[]): Map<string, string[]> {
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

export function defaultTieredPlacementExceptionValidator(): TieredPlacementExceptionValidator {
  return new TieredPlacementExceptionValidator(
    [
      new TieredPlacementExceptionLabelLengthRule(86400),
      new TieredPlacementExceptionSourceLengthRule(120),
      new TieredPlacementExceptionPriorityRangeRule(64, 120),
      new TieredPlacementExceptionRequiredLabelRule("tiered placement exception needs this field"),
      new TieredPlacementExceptionBudgetRangeRule(8.5, 2181.9),
    ],
  );
}
