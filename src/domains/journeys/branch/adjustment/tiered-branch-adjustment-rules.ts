import * as text from "../../../../kit/text.js";
import { TieredBranchAdjustment } from "./tiered-branch-adjustment.js";

/** A rule a tiered branch adjustment must pass. Check returns its problems, or none. */
export interface TieredBranchAdjustmentRule {
  check(item: TieredBranchAdjustment): string[];
}

export class TieredBranchAdjustmentPriorityRangeRule implements TieredBranchAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredBranchAdjustment): string[] {
    const value = item.priority;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`priority ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`priority ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TieredBranchAdjustmentAllowedLabelRule implements TieredBranchAdjustmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TieredBranchAdjustment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is duplicated`];
    return [];
  }
}

export class TieredBranchAdjustmentCodePrefixRule implements TieredBranchAdjustmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TieredBranchAdjustment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class TieredBranchAdjustmentDurationMinutesRangeRule implements TieredBranchAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredBranchAdjustment): string[] {
    const value = item.durationMinutes;
    if (value < this.min || value > this.max) return [`duration minutes ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredBranchAdjustmentCodeLengthRule implements TieredBranchAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredBranchAdjustment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredBranchAdjustmentLabelLengthRule implements TieredBranchAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredBranchAdjustment): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a tiered branch adjustment. */
export class TieredBranchAdjustmentValidator {
  rules: TieredBranchAdjustmentRule[];

  constructor(rules: TieredBranchAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: TieredBranchAdjustment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredBranchAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredBranchAdjustment[]): Map<string, string[]> {
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

export function defaultTieredBranchAdjustmentValidator(): TieredBranchAdjustmentValidator {
  return new TieredBranchAdjustmentValidator(
    [
      new TieredBranchAdjustmentPriorityRangeRule(32, 32),
      new TieredBranchAdjustmentAllowedLabelRule(["batched", "legacy", "strict"]),
      new TieredBranchAdjustmentCodePrefixRule("Q"),
      new TieredBranchAdjustmentDurationMinutesRangeRule(32, 120),
      new TieredBranchAdjustmentCodeLengthRule(64),
      new TieredBranchAdjustmentLabelLengthRule(255),
    ],
  );
}
