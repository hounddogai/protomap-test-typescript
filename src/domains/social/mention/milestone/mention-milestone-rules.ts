import { MentionMilestone } from "./mention-milestone.js";

/** A rule a mention milestone must pass. Check returns its problems, or none. */
export interface MentionMilestoneRule {
  check(item: MentionMilestone): string[];
}

export class MentionMilestoneCodePrefixRule implements MentionMilestoneRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: MentionMilestone): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class MentionMilestoneAmountRangeRule implements MentionMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: MentionMilestone): string[] {
    const value = item.amount;
    if (value < this.min || value > this.max) return [`amount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class MentionMilestoneLabelLengthRule implements MentionMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MentionMilestone): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a mention milestone. */
export class MentionMilestoneValidator {
  rules: MentionMilestoneRule[];

  constructor(rules: MentionMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: MentionMilestone): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: MentionMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: MentionMilestone[]): Map<string, string[]> {
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

export function defaultMentionMilestoneValidator(): MentionMilestoneValidator {
  return new MentionMilestoneValidator(
    [
      new MentionMilestoneCodePrefixRule("Q"),
      new MentionMilestoneAmountRangeRule(6.8, 455.7),
      new MentionMilestoneLabelLengthRule(32),
    ],
  );
}
