import * as text from "../../../../kit/text.js";
import { PendingPostCycle } from "./pending-post-cycle.js";

/** A rule a pending post cycle must pass. Check returns its problems, or none. */
export interface PendingPostCycleRule {
  check(item: PendingPostCycle): string[];
}

export class PendingPostCycleAllowedCodeRule implements PendingPostCycleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PendingPostCycle): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is above maximum`];
    return [];
  }
}

export class PendingPostCycleAmountRangeRule implements PendingPostCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingPostCycle): string[] {
    const value = item.amount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`amount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`amount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PendingPostCycleNameLengthRule implements PendingPostCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingPostCycle): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a pending post cycle. */
export class PendingPostCycleValidator {
  rules: PendingPostCycleRule[];

  constructor(rules: PendingPostCycleRule[]) {
    this.rules = rules;
  }

  validate(item: PendingPostCycle): string[] {
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

  requireValid(item: PendingPostCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingPostCycle[]): Map<string, string[]> {
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

export function defaultPendingPostCycleValidator(): PendingPostCycleValidator {
  return new PendingPostCycleValidator(
    [
      new PendingPostCycleAllowedCodeRule(["legacy", "strict"]),
      new PendingPostCycleAmountRangeRule(9.9, 3777.8),
      new PendingPostCycleNameLengthRule(80),
    ],
  );
}
