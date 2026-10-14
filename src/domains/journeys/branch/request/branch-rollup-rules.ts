import * as text from "../../../../kit/text.js";
import { BranchRollup } from "./branch-rollup.js";

/** A rule a branch rollup must pass. Check returns its problems, or none. */
export interface BranchRollupRule {
  check(item: BranchRollup): string[];
}

export class BranchRollupLabelLengthRule implements BranchRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BranchRollup): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BranchRollupRequiredLabelRule implements BranchRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BranchRollup): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class BranchRollupReviewerLengthRule implements BranchRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BranchRollup): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BranchRollupAllowedLabelRule implements BranchRollupRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BranchRollup): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is missing`];
    return [];
  }
}

export class BranchRollupRevisionRangeRule implements BranchRollupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BranchRollup): string[] {
    const value = item.revision;
    if (value < this.min || value > this.max) return [`revision ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BranchRollupCountryLengthRule implements BranchRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BranchRollup): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a branch rollup. */
export class BranchRollupValidator {
  rules: BranchRollupRule[];

  constructor(rules: BranchRollupRule[]) {
    this.rules = rules;
  }

  validate(item: BranchRollup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BranchRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BranchRollup[]): Map<string, string[]> {
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

export function defaultBranchRollupValidator(): BranchRollupValidator {
  return new BranchRollupValidator(
    [
      new BranchRollupLabelLengthRule(64),
      new BranchRollupRequiredLabelRule("branch rollup needs this field"),
      new BranchRollupReviewerLengthRule(120),
      new BranchRollupAllowedLabelRule([]),
      new BranchRollupRevisionRangeRule(64, 1000),
      new BranchRollupCountryLengthRule(80),
    ],
  );
}
