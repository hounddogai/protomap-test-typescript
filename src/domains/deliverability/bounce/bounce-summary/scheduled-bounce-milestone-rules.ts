import * as text from "../../../../kit/text.js";
import { ScheduledBounceMilestone } from "./scheduled-bounce-milestone.js";

/** A rule a scheduled bounce milestone must pass. Check returns its problems, or none. */
export interface ScheduledBounceMilestoneRule {
  check(item: ScheduledBounceMilestone): string[];
}

export class ScheduledBounceMilestoneAllowedNameRule implements ScheduledBounceMilestoneRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ScheduledBounceMilestone): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is blocked`];
    return [];
  }
}

export class ScheduledBounceMilestoneRequiredLocaleRule implements ScheduledBounceMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledBounceMilestone): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledBounceMilestoneCodeLengthRule implements ScheduledBounceMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledBounceMilestone): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledBounceMilestoneThresholdRangeRule implements ScheduledBounceMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledBounceMilestone): string[] {
    const value = item.threshold;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`threshold ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`threshold ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a scheduled bounce milestone. */
export class ScheduledBounceMilestoneValidator {
  rules: ScheduledBounceMilestoneRule[];

  constructor(rules: ScheduledBounceMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledBounceMilestone): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ScheduledBounceMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledBounceMilestone[]): Map<string, string[]> {
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

export function defaultScheduledBounceMilestoneValidator(): ScheduledBounceMilestoneValidator {
  return new ScheduledBounceMilestoneValidator(
    [
      new ScheduledBounceMilestoneAllowedNameRule([]),
      new ScheduledBounceMilestoneRequiredLocaleRule("scheduled bounce milestone needs an entry"),
      new ScheduledBounceMilestoneCodeLengthRule(32),
      new ScheduledBounceMilestoneThresholdRangeRule(7.1, 2888.3),
    ],
  );
}
