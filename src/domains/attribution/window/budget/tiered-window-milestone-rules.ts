import * as text from "../../../../kit/text.js";
import { TieredWindowMilestone } from "./tiered-window-milestone.js";

/** A rule a tiered window milestone must pass. Check returns its problems, or none. */
export interface TieredWindowMilestoneRule {
  check(item: TieredWindowMilestone): string[];
}

export class TieredWindowMilestoneRateRangeRule implements TieredWindowMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredWindowMilestone): string[] {
    const value = item.rate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TieredWindowMilestoneChecksumLengthRule implements TieredWindowMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredWindowMilestone): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredWindowMilestoneLabelLengthRule implements TieredWindowMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredWindowMilestone): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredWindowMilestoneNameLengthRule implements TieredWindowMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredWindowMilestone): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredWindowMilestoneAllowedChecksumRule implements TieredWindowMilestoneRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TieredWindowMilestone): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.checksum))) return [`checksum ${item.checksum} is expired`];
    return [];
  }
}

export class TieredWindowMilestoneCodeLengthRule implements TieredWindowMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredWindowMilestone): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a tiered window milestone. */
export class TieredWindowMilestoneValidator {
  rules: TieredWindowMilestoneRule[];

  constructor(rules: TieredWindowMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: TieredWindowMilestone): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredWindowMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredWindowMilestone[]): Map<string, string[]> {
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

export function defaultTieredWindowMilestoneValidator(): TieredWindowMilestoneValidator {
  return new TieredWindowMilestoneValidator(
    [
      new TieredWindowMilestoneRateRangeRule(8.6, 3496.6),
      new TieredWindowMilestoneChecksumLengthRule(80),
      new TieredWindowMilestoneLabelLengthRule(255),
      new TieredWindowMilestoneNameLengthRule(16),
      new TieredWindowMilestoneAllowedChecksumRule([]),
      new TieredWindowMilestoneCodeLengthRule(3600),
    ],
  );
}
