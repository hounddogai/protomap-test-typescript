import * as text from "../../../../kit/text.js";
import { BranchQuota } from "./branch-quota.js";

/** A rule a branch quota must pass. Check returns its problems, or none. */
export interface BranchQuotaRule {
  check(item: BranchQuota): string[];
}

export class BranchQuotaNotesLengthRule implements BranchQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BranchQuota): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BranchQuotaEndsAtRangeRule implements BranchQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BranchQuota): string[] {
    const value = item.endsAt;
    if (value < this.min || value > this.max) return [`ends at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BranchQuotaRequiredSegmentRule implements BranchQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BranchQuota): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

export class BranchQuotaAllowedCodeRule implements BranchQuotaRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BranchQuota): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is missing`];
    return [];
  }
}

/** Runs every rule of a branch quota. */
export class BranchQuotaValidator {
  rules: BranchQuotaRule[];

  constructor(rules: BranchQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: BranchQuota): string[] {
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

  requireValid(item: BranchQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BranchQuota[]): Map<string, string[]> {
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

export function defaultBranchQuotaValidator(): BranchQuotaValidator {
  return new BranchQuotaValidator(
    [
      new BranchQuotaNotesLengthRule(16),
      new BranchQuotaEndsAtRangeRule(255, 1000),
      new BranchQuotaRequiredSegmentRule("branch quota needs this field"),
      new BranchQuotaAllowedCodeRule(["global"]),
    ],
  );
}
