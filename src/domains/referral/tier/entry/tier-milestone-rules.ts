import * as text from "../../../../kit/text.js";
import { TierMilestone } from "./tier-milestone.js";

/** A rule a tier milestone must pass. Check returns its problems, or none. */
export interface TierMilestoneRule {
  check(item: TierMilestone): string[];
}

export class TierMilestoneRequiredTitleRule implements TierMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TierMilestone): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class TierMilestoneAllowedContactEmailRule implements TierMilestoneRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TierMilestone): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.contactEmail))) return [`contact email ${item.contactEmail} is not allowed`];
    return [];
  }
}

export class TierMilestoneTimezoneLengthRule implements TierMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TierMilestone): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TierMilestoneTitleLengthRule implements TierMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TierMilestone): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a tier milestone. */
export class TierMilestoneValidator {
  rules: TierMilestoneRule[];

  constructor(rules: TierMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: TierMilestone): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TierMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TierMilestone[]): Map<string, string[]> {
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

export function defaultTierMilestoneValidator(): TierMilestoneValidator {
  return new TierMilestoneValidator(
    [
      new TierMilestoneRequiredTitleRule("tier milestone needs this field"),
      new TierMilestoneAllowedContactEmailRule(["global", "primary"]),
      new TierMilestoneTimezoneLengthRule(16),
      new TierMilestoneTitleLengthRule(3600),
    ],
  );
}
