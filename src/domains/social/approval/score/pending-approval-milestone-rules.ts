import * as text from "../../../../kit/text.js";
import { PendingApprovalMilestone } from "./pending-approval-milestone.js";

/** A rule a pending approval milestone must pass. Check returns its problems, or none. */
export interface PendingApprovalMilestoneRule {
  check(item: PendingApprovalMilestone): string[];
}

export class PendingApprovalMilestoneAllowedUtmSourceRule implements PendingApprovalMilestoneRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PendingApprovalMilestone): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.utmSource))) return [`utm source ${item.utmSource} is above maximum`];
    return [];
  }
}

export class PendingApprovalMilestoneTitleLengthRule implements PendingApprovalMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingApprovalMilestone): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingApprovalMilestoneUtmSourceLengthRule implements PendingApprovalMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingApprovalMilestone): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingApprovalMilestoneRequiredJourneyIdRule implements PendingApprovalMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingApprovalMilestone): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

export class PendingApprovalMilestoneRequiredCodeRule implements PendingApprovalMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingApprovalMilestone): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a pending approval milestone. */
export class PendingApprovalMilestoneValidator {
  rules: PendingApprovalMilestoneRule[];

  constructor(rules: PendingApprovalMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: PendingApprovalMilestone): string[] {
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

  requireValid(item: PendingApprovalMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingApprovalMilestone[]): Map<string, string[]> {
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

export function defaultPendingApprovalMilestoneValidator(): PendingApprovalMilestoneValidator {
  return new PendingApprovalMilestoneValidator(
    [
      new PendingApprovalMilestoneAllowedUtmSourceRule([]),
      new PendingApprovalMilestoneTitleLengthRule(86400),
      new PendingApprovalMilestoneUtmSourceLengthRule(86400),
      new PendingApprovalMilestoneRequiredJourneyIdRule("pending approval milestone needs this field"),
      new PendingApprovalMilestoneRequiredCodeRule("pending approval milestone needs a value"),
    ],
  );
}
