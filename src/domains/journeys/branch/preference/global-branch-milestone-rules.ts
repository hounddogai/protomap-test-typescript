import * as text from "../../../../kit/text.js";
import { GlobalBranchMilestone } from "./global-branch-milestone.js";

/** A rule a global branch milestone must pass. Check returns its problems, or none. */
export interface GlobalBranchMilestoneRule {
  check(item: GlobalBranchMilestone): string[];
}

export class GlobalBranchMilestoneCodePrefixRule implements GlobalBranchMilestoneRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: GlobalBranchMilestone): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class GlobalBranchMilestoneRequiredCampaignRefRule implements GlobalBranchMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalBranchMilestone): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalBranchMilestoneLabelLengthRule implements GlobalBranchMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalBranchMilestone): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalBranchMilestoneAllowedCampaignRefRule implements GlobalBranchMilestoneRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: GlobalBranchMilestone): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.campaignRef))) return [`campaign ref ${item.campaignRef} is duplicated`];
    return [];
  }
}

/** Runs every rule of a global branch milestone. */
export class GlobalBranchMilestoneValidator {
  rules: GlobalBranchMilestoneRule[];

  constructor(rules: GlobalBranchMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalBranchMilestone): string[] {
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

  requireValid(item: GlobalBranchMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalBranchMilestone[]): Map<string, string[]> {
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

export function defaultGlobalBranchMilestoneValidator(): GlobalBranchMilestoneValidator {
  return new GlobalBranchMilestoneValidator(
    [
      new GlobalBranchMilestoneCodePrefixRule("Q"),
      new GlobalBranchMilestoneRequiredCampaignRefRule("global branch milestone needs an entry"),
      new GlobalBranchMilestoneLabelLengthRule(16),
      new GlobalBranchMilestoneAllowedCampaignRefRule(["lenient", "seasonal"]),
    ],
  );
}
