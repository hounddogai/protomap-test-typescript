import * as text from "../../../../kit/text.js";
import { PrimaryBranchEstimate } from "./primary-branch-estimate.js";

/** A rule a primary branch estimate must pass. Check returns its problems, or none. */
export interface PrimaryBranchEstimateRule {
  check(item: PrimaryBranchEstimate): string[];
}

export class PrimaryBranchEstimateSegmentLengthRule implements PrimaryBranchEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryBranchEstimate): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryBranchEstimateRequiredLocaleRule implements PrimaryBranchEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryBranchEstimate): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryBranchEstimateAllowedSegmentRule implements PrimaryBranchEstimateRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PrimaryBranchEstimate): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.segment))) return [`segment ${item.segment} is missing`];
    return [];
  }
}

/** Runs every rule of a primary branch estimate. */
export class PrimaryBranchEstimateValidator {
  rules: PrimaryBranchEstimateRule[];

  constructor(rules: PrimaryBranchEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryBranchEstimate): string[] {
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

  requireValid(item: PrimaryBranchEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryBranchEstimate[]): Map<string, string[]> {
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

export function defaultPrimaryBranchEstimateValidator(): PrimaryBranchEstimateValidator {
  return new PrimaryBranchEstimateValidator(
    [
      new PrimaryBranchEstimateSegmentLengthRule(80),
      new PrimaryBranchEstimateRequiredLocaleRule("primary branch estimate needs a value"),
      new PrimaryBranchEstimateAllowedSegmentRule([]),
    ],
  );
}
