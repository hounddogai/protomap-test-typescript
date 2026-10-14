import * as text from "../../../../kit/text.js";
import { FallbackExitRuleCycle } from "./fallback-exit-rule-cycle.js";

/** A rule a fallback exit rule cycle must pass. Check returns its problems, or none. */
export interface FallbackExitRuleCycleRule {
  check(item: FallbackExitRuleCycle): string[];
}

export class FallbackExitRuleCycleAttemptsRangeRule implements FallbackExitRuleCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackExitRuleCycle): string[] {
    const value = item.attempts;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`attempts ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`attempts ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FallbackExitRuleCycleBudgetRangeRule implements FallbackExitRuleCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackExitRuleCycle): string[] {
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

export class FallbackExitRuleCycleScoreRangeRule implements FallbackExitRuleCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackExitRuleCycle): string[] {
    const value = item.score;
    if (value < this.min || value > this.max) return [`score ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FallbackExitRuleCycleCategoryLengthRule implements FallbackExitRuleCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackExitRuleCycle): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackExitRuleCycleAllowedCategoryRule implements FallbackExitRuleCycleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FallbackExitRuleCycle): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.category))) return [`category ${item.category} is inconsistent`];
    return [];
  }
}

export class FallbackExitRuleCycleRequiredCodeRule implements FallbackExitRuleCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackExitRuleCycle): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a fallback exit rule cycle. */
export class FallbackExitRuleCycleValidator {
  rules: FallbackExitRuleCycleRule[];

  constructor(rules: FallbackExitRuleCycleRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackExitRuleCycle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackExitRuleCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackExitRuleCycle[]): Map<string, string[]> {
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

export function defaultFallbackExitRuleCycleValidator(): FallbackExitRuleCycleValidator {
  return new FallbackExitRuleCycleValidator(
    [
      new FallbackExitRuleCycleAttemptsRangeRule(80, 120),
      new FallbackExitRuleCycleBudgetRangeRule(8.9, 4385.3),
      new FallbackExitRuleCycleScoreRangeRule(5.6, 2499.2),
      new FallbackExitRuleCycleCategoryLengthRule(80),
      new FallbackExitRuleCycleAllowedCategoryRule([]),
      new FallbackExitRuleCycleRequiredCodeRule("fallback exit rule cycle needs this field"),
    ],
  );
}
