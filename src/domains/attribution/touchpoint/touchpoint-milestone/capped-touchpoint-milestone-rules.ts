import { CappedTouchpointMilestone } from "./capped-touchpoint-milestone.js";

/** A rule a capped touchpoint milestone must pass. Check returns its problems, or none. */
export interface CappedTouchpointMilestoneRule {
  check(item: CappedTouchpointMilestone): string[];
}

export class CappedTouchpointMilestoneApprovedGuardRule implements CappedTouchpointMilestoneRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: CappedTouchpointMilestone): string[] {
    if (item.approved && item.ratio > this.limit) return [`ratio ${item.ratio} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class CappedTouchpointMilestoneCampaignRefLengthRule implements CappedTouchpointMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedTouchpointMilestone): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedTouchpointMilestoneCodePrefixRule implements CappedTouchpointMilestoneRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CappedTouchpointMilestone): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CappedTouchpointMilestoneRatioRangeRule implements CappedTouchpointMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedTouchpointMilestone): string[] {
    const value = item.ratio;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ratio ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ratio ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CappedTouchpointMilestoneRequiredCodeRule implements CappedTouchpointMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedTouchpointMilestone): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a capped touchpoint milestone. */
export class CappedTouchpointMilestoneValidator {
  rules: CappedTouchpointMilestoneRule[];

  constructor(rules: CappedTouchpointMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: CappedTouchpointMilestone): string[] {
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

  requireValid(item: CappedTouchpointMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedTouchpointMilestone[]): Map<string, string[]> {
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

export function defaultCappedTouchpointMilestoneValidator(): CappedTouchpointMilestoneValidator {
  return new CappedTouchpointMilestoneValidator(
    [
      new CappedTouchpointMilestoneApprovedGuardRule(7.9),
      new CappedTouchpointMilestoneCampaignRefLengthRule(32),
      new CappedTouchpointMilestoneCodePrefixRule("X"),
      new CappedTouchpointMilestoneRatioRangeRule(9.4, 259.3),
      new CappedTouchpointMilestoneRequiredCodeRule("capped touchpoint milestone needs this field"),
    ],
  );
}
