import * as text from "../../../../kit/text.js";
import { BatchedTicketViewTier } from "./batched-ticket-view-tier.js";

/** A rule a batched ticket view tier must pass. Check returns its problems, or none. */
export interface BatchedTicketViewTierRule {
  check(item: BatchedTicketViewTier): string[];
}

export class BatchedTicketViewTierAllowedLabelRule implements BatchedTicketViewTierRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BatchedTicketViewTier): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is duplicated`];
    return [];
  }
}

export class BatchedTicketViewTierBudgetRangeRule implements BatchedTicketViewTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedTicketViewTier): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BatchedTicketViewTierVersionRangeRule implements BatchedTicketViewTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedTicketViewTier): string[] {
    const value = item.version;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`version ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`version ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BatchedTicketViewTierLabelLengthRule implements BatchedTicketViewTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedTicketViewTier): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a batched ticket view tier. */
export class BatchedTicketViewTierValidator {
  rules: BatchedTicketViewTierRule[];

  constructor(rules: BatchedTicketViewTierRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedTicketViewTier): string[] {
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

  requireValid(item: BatchedTicketViewTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedTicketViewTier[]): Map<string, string[]> {
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

export function defaultBatchedTicketViewTierValidator(): BatchedTicketViewTierValidator {
  return new BatchedTicketViewTierValidator(
    [
      new BatchedTicketViewTierAllowedLabelRule([]),
      new BatchedTicketViewTierBudgetRangeRule(0.7, 709.6),
      new BatchedTicketViewTierVersionRangeRule(32, 80),
      new BatchedTicketViewTierLabelLengthRule(120),
    ],
  );
}
