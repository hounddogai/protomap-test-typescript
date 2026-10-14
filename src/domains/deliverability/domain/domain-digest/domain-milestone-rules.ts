import * as text from "../../../../kit/text.js";
import { DomainMilestone } from "./domain-milestone.js";

/** A rule a domain milestone must pass. Check returns its problems, or none. */
export interface DomainMilestoneRule {
  check(item: DomainMilestone): string[];
}

export class DomainMilestoneLimitRangeRule implements DomainMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DomainMilestone): string[] {
    const value = item.limit;
    if (value < this.min || value > this.max) return [`limit ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DomainMilestoneMinimumRangeRule implements DomainMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DomainMilestone): string[] {
    const value = item.minimum;
    if (value < this.min || value > this.max) return [`minimum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DomainMilestoneSendAtRangeRule implements DomainMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DomainMilestone): string[] {
    const value = item.sendAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`send at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`send at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DomainMilestoneAllowedCodeRule implements DomainMilestoneRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DomainMilestone): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is expired`];
    return [];
  }
}

export class DomainMilestoneNameLengthRule implements DomainMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DomainMilestone): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DomainMilestoneCodeLengthRule implements DomainMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DomainMilestone): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a domain milestone. */
export class DomainMilestoneValidator {
  rules: DomainMilestoneRule[];

  constructor(rules: DomainMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: DomainMilestone): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DomainMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DomainMilestone[]): Map<string, string[]> {
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

export function defaultDomainMilestoneValidator(): DomainMilestoneValidator {
  return new DomainMilestoneValidator(
    [
      new DomainMilestoneLimitRangeRule(32, 64),
      new DomainMilestoneMinimumRangeRule(2.4, 1554.2),
      new DomainMilestoneSendAtRangeRule(32, 80),
      new DomainMilestoneAllowedCodeRule(["batched", "seasonal"]),
      new DomainMilestoneNameLengthRule(120),
      new DomainMilestoneCodeLengthRule(120),
    ],
  );
}
