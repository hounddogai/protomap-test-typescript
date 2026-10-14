import { PendingWaitMilestone } from "./pending-wait-milestone.js";

/** A rule a pending wait milestone must pass. Check returns its problems, or none. */
export interface PendingWaitMilestoneRule {
  check(item: PendingWaitMilestone): string[];
}

export class PendingWaitMilestoneClicksRangeRule implements PendingWaitMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingWaitMilestone): string[] {
    const value = item.clicks;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`clicks ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`clicks ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PendingWaitMilestoneCodeLengthRule implements PendingWaitMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingWaitMilestone): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingWaitMilestoneLocaleLengthRule implements PendingWaitMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingWaitMilestone): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingWaitMilestoneRequiredCodeRule implements PendingWaitMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingWaitMilestone): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a pending wait milestone. */
export class PendingWaitMilestoneValidator {
  rules: PendingWaitMilestoneRule[];

  constructor(rules: PendingWaitMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: PendingWaitMilestone): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PendingWaitMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingWaitMilestone[]): Map<string, string[]> {
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

export function defaultPendingWaitMilestoneValidator(): PendingWaitMilestoneValidator {
  return new PendingWaitMilestoneValidator(
    [
      new PendingWaitMilestoneClicksRangeRule(120, 86400),
      new PendingWaitMilestoneCodeLengthRule(255),
      new PendingWaitMilestoneLocaleLengthRule(255),
      new PendingWaitMilestoneRequiredCodeRule("pending wait milestone needs an entry"),
    ],
  );
}
