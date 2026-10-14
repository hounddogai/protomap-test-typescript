import * as text from "../../../../kit/text.js";
import { BranchVariance } from "./branch-variance.js";

/** A rule a branch variance must pass. Check returns its problems, or none. */
export interface BranchVarianceRule {
  check(item: BranchVariance): string[];
}

export class BranchVarianceNameLengthRule implements BranchVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BranchVariance): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BranchVarianceApprovedGuardRule implements BranchVarianceRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: BranchVariance): string[] {
    if (item.approved && item.discount > this.limit) return [`discount ${item.discount} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class BranchVarianceRequiredCodeRule implements BranchVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BranchVariance): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BranchVarianceCodeLengthRule implements BranchVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BranchVariance): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BranchVarianceRequiredLabelRule implements BranchVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BranchVariance): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class BranchVarianceAllowedNameRule implements BranchVarianceRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BranchVariance): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is out of range`];
    return [];
  }
}

/** Runs every rule of a branch variance. */
export class BranchVarianceValidator {
  rules: BranchVarianceRule[];

  constructor(rules: BranchVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: BranchVariance): string[] {
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

  requireValid(item: BranchVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BranchVariance[]): Map<string, string[]> {
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

export function defaultBranchVarianceValidator(): BranchVarianceValidator {
  return new BranchVarianceValidator(
    [
      new BranchVarianceNameLengthRule(32),
      new BranchVarianceApprovedGuardRule(4.6),
      new BranchVarianceRequiredCodeRule("branch variance needs an entry"),
      new BranchVarianceCodeLengthRule(3600),
      new BranchVarianceRequiredLabelRule("branch variance needs this field"),
      new BranchVarianceAllowedNameRule([]),
    ],
  );
}
