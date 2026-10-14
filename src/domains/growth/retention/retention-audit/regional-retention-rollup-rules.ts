import * as text from "../../../../kit/text.js";
import { RegionalRetentionRollup } from "./regional-retention-rollup.js";

/** A rule a regional retention rollup must pass. Check returns its problems, or none. */
export interface RegionalRetentionRollupRule {
  check(item: RegionalRetentionRollup): string[];
}

export class RegionalRetentionRollupAllowedSegmentRule implements RegionalRetentionRollupRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RegionalRetentionRollup): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.segment))) return [`segment ${item.segment} is inconsistent`];
    return [];
  }
}

export class RegionalRetentionRollupSummaryLengthRule implements RegionalRetentionRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalRetentionRollup): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalRetentionRollupTitleLengthRule implements RegionalRetentionRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalRetentionRollup): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a regional retention rollup. */
export class RegionalRetentionRollupValidator {
  rules: RegionalRetentionRollupRule[];

  constructor(rules: RegionalRetentionRollupRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalRetentionRollup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RegionalRetentionRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalRetentionRollup[]): Map<string, string[]> {
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

export function defaultRegionalRetentionRollupValidator(): RegionalRetentionRollupValidator {
  return new RegionalRetentionRollupValidator(
    [
      new RegionalRetentionRollupAllowedSegmentRule(["pending"]),
      new RegionalRetentionRollupSummaryLengthRule(255),
      new RegionalRetentionRollupTitleLengthRule(64),
    ],
  );
}
