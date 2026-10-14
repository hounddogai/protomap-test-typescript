import * as text from "../../../../kit/text.js";
import { PrimaryBranchRollup } from "./primary-branch-rollup.js";

/** A rule a primary branch rollup must pass. Check returns its problems, or none. */
export interface PrimaryBranchRollupRule {
  check(item: PrimaryBranchRollup): string[];
}

export class PrimaryBranchRollupGraceDaysRangeRule implements PrimaryBranchRollupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryBranchRollup): string[] {
    const value = item.graceDays;
    if (value < this.min || value > this.max) return [`grace days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PrimaryBranchRollupAllowedCodeRule implements PrimaryBranchRollupRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PrimaryBranchRollup): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is out of range`];
    return [];
  }
}

export class PrimaryBranchRollupRequiredCodeRule implements PrimaryBranchRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryBranchRollup): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryBranchRollupRequiredNameRule implements PrimaryBranchRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryBranchRollup): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryBranchRollupStartsAtRangeRule implements PrimaryBranchRollupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryBranchRollup): string[] {
    const value = item.startsAt;
    if (value < this.min || value > this.max) return [`starts at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PrimaryBranchRollupRevisionRangeRule implements PrimaryBranchRollupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryBranchRollup): string[] {
    const value = item.revision;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`revision ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`revision ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a primary branch rollup. */
export class PrimaryBranchRollupValidator {
  rules: PrimaryBranchRollupRule[];

  constructor(rules: PrimaryBranchRollupRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryBranchRollup): string[] {
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

  requireValid(item: PrimaryBranchRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryBranchRollup[]): Map<string, string[]> {
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

export function defaultPrimaryBranchRollupValidator(): PrimaryBranchRollupValidator {
  return new PrimaryBranchRollupValidator(
    [
      new PrimaryBranchRollupGraceDaysRangeRule(120, 1000),
      new PrimaryBranchRollupAllowedCodeRule(["weighted", "legacy", "seasonal"]),
      new PrimaryBranchRollupRequiredCodeRule("primary branch rollup needs this field"),
      new PrimaryBranchRollupRequiredNameRule("primary branch rollup needs this field"),
      new PrimaryBranchRollupStartsAtRangeRule(3600, 3600),
      new PrimaryBranchRollupRevisionRangeRule(255, 1000),
    ],
  );
}
