import * as text from "../../../../kit/text.js";
import { PrimaryPacingPlan } from "./primary-pacing-plan.js";

/** A rule a primary pacing plan must pass. Check returns its problems, or none. */
export interface PrimaryPacingPlanRule {
  check(item: PrimaryPacingPlan): string[];
}

export class PrimaryPacingPlanLimitRangeRule implements PrimaryPacingPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryPacingPlan): string[] {
    const value = item.limit;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`limit ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`limit ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PrimaryPacingPlanDurationMinutesRangeRule implements PrimaryPacingPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryPacingPlan): string[] {
    const value = item.durationMinutes;
    if (value < this.min || value > this.max) return [`duration minutes ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PrimaryPacingPlanRequiredTitleRule implements PrimaryPacingPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryPacingPlan): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryPacingPlanAllowedCodeRule implements PrimaryPacingPlanRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PrimaryPacingPlan): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is unknown`];
    return [];
  }
}

export class PrimaryPacingPlanAttemptsRangeRule implements PrimaryPacingPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryPacingPlan): string[] {
    const value = item.attempts;
    if (value < this.min || value > this.max) return [`attempts ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PrimaryPacingPlanTitleLengthRule implements PrimaryPacingPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryPacingPlan): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a primary pacing plan. */
export class PrimaryPacingPlanValidator {
  rules: PrimaryPacingPlanRule[];

  constructor(rules: PrimaryPacingPlanRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryPacingPlan): string[] {
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

  requireValid(item: PrimaryPacingPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryPacingPlan[]): Map<string, string[]> {
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

export function defaultPrimaryPacingPlanValidator(): PrimaryPacingPlanValidator {
  return new PrimaryPacingPlanValidator(
    [
      new PrimaryPacingPlanLimitRangeRule(80, 80),
      new PrimaryPacingPlanDurationMinutesRangeRule(16, 80),
      new PrimaryPacingPlanRequiredTitleRule("primary pacing plan needs an entry"),
      new PrimaryPacingPlanAllowedCodeRule(["batched", "scheduled"]),
      new PrimaryPacingPlanAttemptsRangeRule(64, 80),
      new PrimaryPacingPlanTitleLengthRule(32),
    ],
  );
}
