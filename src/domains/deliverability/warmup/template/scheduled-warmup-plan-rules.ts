import * as text from "../../../../kit/text.js";
import { ScheduledWarmupPlan } from "./scheduled-warmup-plan.js";

/** A rule a scheduled warmup plan must pass. Check returns its problems, or none. */
export interface ScheduledWarmupPlanRule {
  check(item: ScheduledWarmupPlan): string[];
}

export class ScheduledWarmupPlanRateRangeRule implements ScheduledWarmupPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledWarmupPlan): string[] {
    const value = item.rate;
    if (value < this.min || value > this.max) return [`rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ScheduledWarmupPlanWindowDaysRangeRule implements ScheduledWarmupPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledWarmupPlan): string[] {
    const value = item.windowDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`window days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`window days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ScheduledWarmupPlanRequiredContactEmailRule implements ScheduledWarmupPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledWarmupPlan): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledWarmupPlanAllowedCodeRule implements ScheduledWarmupPlanRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ScheduledWarmupPlan): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is missing`];
    return [];
  }
}

export class ScheduledWarmupPlanTitleLengthRule implements ScheduledWarmupPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledWarmupPlan): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a scheduled warmup plan. */
export class ScheduledWarmupPlanValidator {
  rules: ScheduledWarmupPlanRule[];

  constructor(rules: ScheduledWarmupPlanRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledWarmupPlan): string[] {
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

  requireValid(item: ScheduledWarmupPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledWarmupPlan[]): Map<string, string[]> {
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

export function defaultScheduledWarmupPlanValidator(): ScheduledWarmupPlanValidator {
  return new ScheduledWarmupPlanValidator(
    [
      new ScheduledWarmupPlanRateRangeRule(5.8, 4420.8),
      new ScheduledWarmupPlanWindowDaysRangeRule(16, 32),
      new ScheduledWarmupPlanRequiredContactEmailRule("scheduled warmup plan needs an entry"),
      new ScheduledWarmupPlanAllowedCodeRule([]),
      new ScheduledWarmupPlanTitleLengthRule(32),
    ],
  );
}
