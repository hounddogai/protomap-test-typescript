import * as text from "../../../../kit/text.js";
import { DefaultPreferenceMilestone } from "./default-preference-milestone.js";

/** A rule a default preference milestone must pass. Check returns its problems, or none. */
export interface DefaultPreferenceMilestoneRule {
  check(item: DefaultPreferenceMilestone): string[];
}

export class DefaultPreferenceMilestoneCodeLengthRule implements DefaultPreferenceMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultPreferenceMilestone): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultPreferenceMilestoneRequiredUnitRule implements DefaultPreferenceMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultPreferenceMilestone): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultPreferenceMilestoneExpiresAtRangeRule implements DefaultPreferenceMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultPreferenceMilestone): string[] {
    const value = item.expiresAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`expires at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`expires at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DefaultPreferenceMilestoneAllowedUnitRule implements DefaultPreferenceMilestoneRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DefaultPreferenceMilestone): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.unit))) return [`unit ${item.unit} is above maximum`];
    return [];
  }
}

/** Runs every rule of a default preference milestone. */
export class DefaultPreferenceMilestoneValidator {
  rules: DefaultPreferenceMilestoneRule[];

  constructor(rules: DefaultPreferenceMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultPreferenceMilestone): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DefaultPreferenceMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultPreferenceMilestone[]): Map<string, string[]> {
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

export function defaultDefaultPreferenceMilestoneValidator(): DefaultPreferenceMilestoneValidator {
  return new DefaultPreferenceMilestoneValidator(
    [
      new DefaultPreferenceMilestoneCodeLengthRule(1000),
      new DefaultPreferenceMilestoneRequiredUnitRule("default preference milestone needs a value"),
      new DefaultPreferenceMilestoneExpiresAtRangeRule(64, 86400),
      new DefaultPreferenceMilestoneAllowedUnitRule(["scheduled", "primary"]),
    ],
  );
}
