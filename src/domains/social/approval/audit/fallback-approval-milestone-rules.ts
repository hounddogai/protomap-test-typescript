import { FallbackApprovalMilestone } from "./fallback-approval-milestone.js";

/** A rule a fallback approval milestone must pass. Check returns its problems, or none. */
export interface FallbackApprovalMilestoneRule {
  check(item: FallbackApprovalMilestone): string[];
}

export class FallbackApprovalMilestoneRequiredCodeRule implements FallbackApprovalMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackApprovalMilestone): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackApprovalMilestoneThresholdRangeRule implements FallbackApprovalMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackApprovalMilestone): string[] {
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

export class FallbackApprovalMilestoneLocaleLengthRule implements FallbackApprovalMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackApprovalMilestone): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackApprovalMilestoneRevisionRangeRule implements FallbackApprovalMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackApprovalMilestone): string[] {
    const value = item.revision;
    if (value < this.min || value > this.max) return [`revision ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a fallback approval milestone. */
export class FallbackApprovalMilestoneValidator {
  rules: FallbackApprovalMilestoneRule[];

  constructor(rules: FallbackApprovalMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackApprovalMilestone): string[] {
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

  requireValid(item: FallbackApprovalMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackApprovalMilestone[]): Map<string, string[]> {
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

export function defaultFallbackApprovalMilestoneValidator(): FallbackApprovalMilestoneValidator {
  return new FallbackApprovalMilestoneValidator(
    [
      new FallbackApprovalMilestoneRequiredCodeRule("fallback approval milestone needs an entry"),
      new FallbackApprovalMilestoneThresholdRangeRule(9.1, 1281.4),
      new FallbackApprovalMilestoneLocaleLengthRule(80),
      new FallbackApprovalMilestoneRevisionRangeRule(80, 1000),
    ],
  );
}
