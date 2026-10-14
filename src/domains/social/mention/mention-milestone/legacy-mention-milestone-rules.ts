import { LegacyMentionMilestone } from "./legacy-mention-milestone.js";

/** A rule a legacy mention milestone must pass. Check returns its problems, or none. */
export interface LegacyMentionMilestoneRule {
  check(item: LegacyMentionMilestone): string[];
}

export class LegacyMentionMilestoneLabelLengthRule implements LegacyMentionMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyMentionMilestone): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyMentionMilestoneChecksumLengthRule implements LegacyMentionMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyMentionMilestone): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyMentionMilestoneRequiredLabelRule implements LegacyMentionMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyMentionMilestone): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a legacy mention milestone. */
export class LegacyMentionMilestoneValidator {
  rules: LegacyMentionMilestoneRule[];

  constructor(rules: LegacyMentionMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyMentionMilestone): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacyMentionMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyMentionMilestone[]): Map<string, string[]> {
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

export function defaultLegacyMentionMilestoneValidator(): LegacyMentionMilestoneValidator {
  return new LegacyMentionMilestoneValidator(
    [
      new LegacyMentionMilestoneLabelLengthRule(80),
      new LegacyMentionMilestoneChecksumLengthRule(80),
      new LegacyMentionMilestoneRequiredLabelRule("legacy mention milestone needs an entry"),
    ],
  );
}
