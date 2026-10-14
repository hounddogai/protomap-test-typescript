import * as text from "../../../../kit/text.js";
import { BatchedTierGroup } from "./batched-tier-group.js";

/** A rule a batched tier group must pass. Check returns its problems, or none. */
export interface BatchedTierGroupRule {
  check(item: BatchedTierGroup): string[];
}

export class BatchedTierGroupSendAtRangeRule implements BatchedTierGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedTierGroup): string[] {
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

export class BatchedTierGroupOpenRateRangeRule implements BatchedTierGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedTierGroup): string[] {
    const value = item.openRate;
    if (value < this.min || value > this.max) return [`open rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BatchedTierGroupEndsAtRangeRule implements BatchedTierGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedTierGroup): string[] {
    const value = item.endsAt;
    if (value < this.min || value > this.max) return [`ends at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BatchedTierGroupAllowedTitleRule implements BatchedTierGroupRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BatchedTierGroup): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is out of range`];
    return [];
  }
}

/** Runs every rule of a batched tier group. */
export class BatchedTierGroupValidator {
  rules: BatchedTierGroupRule[];

  constructor(rules: BatchedTierGroupRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedTierGroup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedTierGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedTierGroup[]): Map<string, string[]> {
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

export function defaultBatchedTierGroupValidator(): BatchedTierGroupValidator {
  return new BatchedTierGroupValidator(
    [
      new BatchedTierGroupSendAtRangeRule(80, 80),
      new BatchedTierGroupOpenRateRangeRule(1.6, 3412.6),
      new BatchedTierGroupEndsAtRangeRule(120, 3600),
      new BatchedTierGroupAllowedTitleRule(["manual", "global"]),
    ],
  );
}
