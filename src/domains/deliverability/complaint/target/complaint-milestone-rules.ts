import * as text from "../../../../kit/text.js";
import { ComplaintMilestone } from "./complaint-milestone.js";

/** A rule a complaint milestone must pass. Check returns its problems, or none. */
export interface ComplaintMilestoneRule {
  check(item: ComplaintMilestone): string[];
}

export class ComplaintMilestoneAllowedCodeRule implements ComplaintMilestoneRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ComplaintMilestone): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is expired`];
    return [];
  }
}

export class ComplaintMilestoneCodePrefixRule implements ComplaintMilestoneRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ComplaintMilestone): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ComplaintMilestoneVisibleGuardRule implements ComplaintMilestoneRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: ComplaintMilestone): string[] {
    if (item.visible && item.threshold > this.limit) return [`threshold ${item.threshold} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class ComplaintMilestoneLabelLengthRule implements ComplaintMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ComplaintMilestone): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a complaint milestone. */
export class ComplaintMilestoneValidator {
  rules: ComplaintMilestoneRule[];

  constructor(rules: ComplaintMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: ComplaintMilestone): string[] {
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

  requireValid(item: ComplaintMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ComplaintMilestone[]): Map<string, string[]> {
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

export function defaultComplaintMilestoneValidator(): ComplaintMilestoneValidator {
  return new ComplaintMilestoneValidator(
    [
      new ComplaintMilestoneAllowedCodeRule(["default", "default"]),
      new ComplaintMilestoneCodePrefixRule("X"),
      new ComplaintMilestoneVisibleGuardRule(8.2),
      new ComplaintMilestoneLabelLengthRule(3600),
    ],
  );
}
