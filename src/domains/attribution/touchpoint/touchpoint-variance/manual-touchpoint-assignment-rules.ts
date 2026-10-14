import * as text from "../../../../kit/text.js";
import { ManualTouchpointAssignment } from "./manual-touchpoint-assignment.js";

/** A rule a manual touchpoint assignment must pass. Check returns its problems, or none. */
export interface ManualTouchpointAssignmentRule {
  check(item: ManualTouchpointAssignment): string[];
}

export class ManualTouchpointAssignmentRequiredSummaryRule implements ManualTouchpointAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualTouchpointAssignment): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

export class ManualTouchpointAssignmentAllowedCampaignRefRule implements ManualTouchpointAssignmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ManualTouchpointAssignment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.campaignRef))) return [`campaign ref ${item.campaignRef} is unknown`];
    return [];
  }
}

export class ManualTouchpointAssignmentSummaryLengthRule implements ManualTouchpointAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualTouchpointAssignment): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a manual touchpoint assignment. */
export class ManualTouchpointAssignmentValidator {
  rules: ManualTouchpointAssignmentRule[];

  constructor(rules: ManualTouchpointAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: ManualTouchpointAssignment): string[] {
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

  requireValid(item: ManualTouchpointAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualTouchpointAssignment[]): Map<string, string[]> {
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

export function defaultManualTouchpointAssignmentValidator(): ManualTouchpointAssignmentValidator {
  return new ManualTouchpointAssignmentValidator(
    [
      new ManualTouchpointAssignmentRequiredSummaryRule("manual touchpoint assignment needs an entry"),
      new ManualTouchpointAssignmentAllowedCampaignRefRule(["tiered"]),
      new ManualTouchpointAssignmentSummaryLengthRule(16),
    ],
  );
}
