import * as text from "../../../../kit/text.js";
import { LevelPlan } from "./level-plan.js";

/** A rule a level plan must pass. Check returns its problems, or none. */
export interface LevelPlanRule {
  check(item: LevelPlan): string[];
}

export class LevelPlanCreatedAtRangeRule implements LevelPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LevelPlan): string[] {
    const value = item.createdAt;
    if (value < this.min || value > this.max) return [`created at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LevelPlanRequiredPhoneRule implements LevelPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LevelPlan): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class LevelPlanAllowedChannelRule implements LevelPlanRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LevelPlan): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.channel))) return [`channel ${item.channel} is out of range`];
    return [];
  }
}

export class LevelPlanPhoneLengthRule implements LevelPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LevelPlan): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a level plan. */
export class LevelPlanValidator {
  rules: LevelPlanRule[];

  constructor(rules: LevelPlanRule[]) {
    this.rules = rules;
  }

  validate(item: LevelPlan): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LevelPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LevelPlan[]): Map<string, string[]> {
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

export function defaultLevelPlanValidator(): LevelPlanValidator {
  return new LevelPlanValidator(
    [
      new LevelPlanCreatedAtRangeRule(32, 120),
      new LevelPlanRequiredPhoneRule("level plan needs a value"),
      new LevelPlanAllowedChannelRule(["default", "weighted", "batched"]),
      new LevelPlanPhoneLengthRule(3600),
    ],
  );
}
