import * as text from "../../../../kit/text.js";
import { PathAllocation } from "./path-allocation.js";

/** A rule a path allocation must pass. Check returns its problems, or none. */
export interface PathAllocationRule {
  check(item: PathAllocation): string[];
}

export class PathAllocationGraceDaysRangeRule implements PathAllocationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PathAllocation): string[] {
    const value = item.graceDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`grace days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`grace days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PathAllocationAllowedLocaleRule implements PathAllocationRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PathAllocation): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.locale))) return [`locale ${item.locale} is too long`];
    return [];
  }
}

export class PathAllocationRateRangeRule implements PathAllocationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PathAllocation): string[] {
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

export class PathAllocationRequiredSummaryRule implements PathAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PathAllocation): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a path allocation. */
export class PathAllocationValidator {
  rules: PathAllocationRule[];

  constructor(rules: PathAllocationRule[]) {
    this.rules = rules;
  }

  validate(item: PathAllocation): string[] {
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

  requireValid(item: PathAllocation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PathAllocation[]): Map<string, string[]> {
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

export function defaultPathAllocationValidator(): PathAllocationValidator {
  return new PathAllocationValidator(
    [
      new PathAllocationGraceDaysRangeRule(32, 32),
      new PathAllocationAllowedLocaleRule(["strict", "scheduled", "lenient"]),
      new PathAllocationRateRangeRule(6.3, 2457.6),
      new PathAllocationRequiredSummaryRule("path allocation needs this field"),
    ],
  );
}
