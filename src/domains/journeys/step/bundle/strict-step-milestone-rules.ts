import * as text from "../../../../kit/text.js";
import { StrictStepMilestone } from "./strict-step-milestone.js";

/** A rule a strict step milestone must pass. Check returns its problems, or none. */
export interface StrictStepMilestoneRule {
  check(item: StrictStepMilestone): string[];
}

export class StrictStepMilestoneImpressionsRangeRule implements StrictStepMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictStepMilestone): string[] {
    const value = item.impressions;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`impressions ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`impressions ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StrictStepMilestoneAllowedNameRule implements StrictStepMilestoneRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StrictStepMilestone): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is too long`];
    return [];
  }
}

export class StrictStepMilestoneVisibleGuardRule implements StrictStepMilestoneRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: StrictStepMilestone): string[] {
    if (item.visible && item.graceDays > this.limit) return [`grace days ${item.graceDays} exceeds ${this.limit} while visible`];
    return [];
  }
}

/** Runs every rule of a strict step milestone. */
export class StrictStepMilestoneValidator {
  rules: StrictStepMilestoneRule[];

  constructor(rules: StrictStepMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: StrictStepMilestone): string[] {
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

  requireValid(item: StrictStepMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictStepMilestone[]): Map<string, string[]> {
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

export function defaultStrictStepMilestoneValidator(): StrictStepMilestoneValidator {
  return new StrictStepMilestoneValidator(
    [
      new StrictStepMilestoneImpressionsRangeRule(16, 1000),
      new StrictStepMilestoneAllowedNameRule(["adaptive", "weighted", "pending"]),
      new StrictStepMilestoneVisibleGuardRule(3600),
    ],
  );
}
