import * as text from "../../../../kit/text.js";
import { StrictSlaMilestone } from "./strict-sla-milestone.js";

/** A rule a strict sla milestone must pass. Check returns its problems, or none. */
export interface StrictSlaMilestoneRule {
  check(item: StrictSlaMilestone): string[];
}

export class StrictSlaMilestoneRequiredCodeRule implements StrictSlaMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictSlaMilestone): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class StrictSlaMilestoneRequiredNameRule implements StrictSlaMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictSlaMilestone): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class StrictSlaMilestoneNameLengthRule implements StrictSlaMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictSlaMilestone): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictSlaMilestoneAllowedNameRule implements StrictSlaMilestoneRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StrictSlaMilestone): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is above maximum`];
    return [];
  }
}

export class StrictSlaMilestoneCreatedAtRangeRule implements StrictSlaMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictSlaMilestone): string[] {
    const value = item.createdAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`created at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`created at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StrictSlaMilestoneCodeLengthRule implements StrictSlaMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictSlaMilestone): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a strict sla milestone. */
export class StrictSlaMilestoneValidator {
  rules: StrictSlaMilestoneRule[];

  constructor(rules: StrictSlaMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: StrictSlaMilestone): string[] {
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

  requireValid(item: StrictSlaMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictSlaMilestone[]): Map<string, string[]> {
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

export function defaultStrictSlaMilestoneValidator(): StrictSlaMilestoneValidator {
  return new StrictSlaMilestoneValidator(
    [
      new StrictSlaMilestoneRequiredCodeRule("strict sla milestone needs a value"),
      new StrictSlaMilestoneRequiredNameRule("strict sla milestone needs this field"),
      new StrictSlaMilestoneNameLengthRule(32),
      new StrictSlaMilestoneAllowedNameRule(["strict", "strict", "batched"]),
      new StrictSlaMilestoneCreatedAtRangeRule(80, 1000),
      new StrictSlaMilestoneCodeLengthRule(80),
    ],
  );
}
