import { ScheduledDoubleOptInAllocation } from "./scheduled-double-opt-in-allocation.js";

/** A rule a scheduled double opt in allocation must pass. Check returns its problems, or none. */
export interface ScheduledDoubleOptInAllocationRule {
  check(item: ScheduledDoubleOptInAllocation): string[];
}

export class ScheduledDoubleOptInAllocationCodeLengthRule implements ScheduledDoubleOptInAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledDoubleOptInAllocation): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledDoubleOptInAllocationLimitRangeRule implements ScheduledDoubleOptInAllocationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledDoubleOptInAllocation): string[] {
    const value = item.limit;
    if (value < this.min || value > this.max) return [`limit ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ScheduledDoubleOptInAllocationSegmentLengthRule implements ScheduledDoubleOptInAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledDoubleOptInAllocation): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a scheduled double opt in allocation. */
export class ScheduledDoubleOptInAllocationValidator {
  rules: ScheduledDoubleOptInAllocationRule[];

  constructor(rules: ScheduledDoubleOptInAllocationRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledDoubleOptInAllocation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ScheduledDoubleOptInAllocation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledDoubleOptInAllocation[]): Map<string, string[]> {
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

export function defaultScheduledDoubleOptInAllocationValidator(): ScheduledDoubleOptInAllocationValidator {
  return new ScheduledDoubleOptInAllocationValidator(
    [
      new ScheduledDoubleOptInAllocationCodeLengthRule(16),
      new ScheduledDoubleOptInAllocationLimitRangeRule(16, 3600),
      new ScheduledDoubleOptInAllocationSegmentLengthRule(32),
    ],
  );
}
