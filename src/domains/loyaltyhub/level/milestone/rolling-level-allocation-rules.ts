import * as text from "../../../../kit/text.js";
import { RollingLevelAllocation } from "./rolling-level-allocation.js";

/** A rule a rolling level allocation must pass. Check returns its problems, or none. */
export interface RollingLevelAllocationRule {
  check(item: RollingLevelAllocation): string[];
}

export class RollingLevelAllocationAllowedCohortRule implements RollingLevelAllocationRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RollingLevelAllocation): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.cohort))) return [`cohort ${item.cohort} is missing`];
    return [];
  }
}

export class RollingLevelAllocationTitleLengthRule implements RollingLevelAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingLevelAllocation): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingLevelAllocationEndsAtRangeRule implements RollingLevelAllocationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingLevelAllocation): string[] {
    const value = item.endsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ends at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ends at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RollingLevelAllocationRequiredTimezoneRule implements RollingLevelAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingLevelAllocation): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a rolling level allocation. */
export class RollingLevelAllocationValidator {
  rules: RollingLevelAllocationRule[];

  constructor(rules: RollingLevelAllocationRule[]) {
    this.rules = rules;
  }

  validate(item: RollingLevelAllocation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingLevelAllocation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingLevelAllocation[]): Map<string, string[]> {
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

export function defaultRollingLevelAllocationValidator(): RollingLevelAllocationValidator {
  return new RollingLevelAllocationValidator(
    [
      new RollingLevelAllocationAllowedCohortRule(["global", "strict", "scheduled"]),
      new RollingLevelAllocationTitleLengthRule(1000),
      new RollingLevelAllocationEndsAtRangeRule(1000, 86400),
      new RollingLevelAllocationRequiredTimezoneRule("rolling level allocation needs a value"),
    ],
  );
}
