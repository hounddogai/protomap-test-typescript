import * as text from "../../../../kit/text.js";
import { PlacementBudget } from "./placement-budget.js";

/** A rule a placement budget must pass. Check returns its problems, or none. */
export interface PlacementBudgetRule {
  check(item: PlacementBudget): string[];
}

export class PlacementBudgetRequiredCodeRule implements PlacementBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PlacementBudget): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PlacementBudgetBudgetRangeRule implements PlacementBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PlacementBudget): string[] {
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

export class PlacementBudgetAudienceIdLengthRule implements PlacementBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PlacementBudget): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PlacementBudgetAllowedCodeRule implements PlacementBudgetRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PlacementBudget): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is below minimum`];
    return [];
  }
}

/** Runs every rule of a placement budget. */
export class PlacementBudgetValidator {
  rules: PlacementBudgetRule[];

  constructor(rules: PlacementBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: PlacementBudget): string[] {
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

  requireValid(item: PlacementBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PlacementBudget[]): Map<string, string[]> {
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

export function defaultPlacementBudgetValidator(): PlacementBudgetValidator {
  return new PlacementBudgetValidator(
    [
      new PlacementBudgetRequiredCodeRule("placement budget needs this field"),
      new PlacementBudgetBudgetRangeRule(4.2, 4033.5),
      new PlacementBudgetAudienceIdLengthRule(80),
      new PlacementBudgetAllowedCodeRule(["regional"]),
    ],
  );
}
