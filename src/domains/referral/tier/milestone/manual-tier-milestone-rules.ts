import * as text from "../../../../kit/text.js";
import { ManualTierMilestone } from "./manual-tier-milestone.js";

/** A rule a manual tier milestone must pass. Check returns its problems, or none. */
export interface ManualTierMilestoneRule {
  check(item: ManualTierMilestone): string[];
}

export class ManualTierMilestoneTitleLengthRule implements ManualTierMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualTierMilestone): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualTierMilestoneCapacityRangeRule implements ManualTierMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualTierMilestone): string[] {
    const value = item.capacity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`capacity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`capacity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ManualTierMilestoneAllowedCodeRule implements ManualTierMilestoneRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ManualTierMilestone): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is out of range`];
    return [];
  }
}

/** Runs every rule of a manual tier milestone. */
export class ManualTierMilestoneValidator {
  rules: ManualTierMilestoneRule[];

  constructor(rules: ManualTierMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: ManualTierMilestone): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualTierMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualTierMilestone[]): Map<string, string[]> {
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

export function defaultManualTierMilestoneValidator(): ManualTierMilestoneValidator {
  return new ManualTierMilestoneValidator(
    [
      new ManualTierMilestoneTitleLengthRule(32),
      new ManualTierMilestoneCapacityRangeRule(80, 80),
      new ManualTierMilestoneAllowedCodeRule(["global"]),
    ],
  );
}
