import { CappedActivationMilestone } from "./capped-activation-milestone.js";

/** A rule a capped activation milestone must pass. Check returns its problems, or none. */
export interface CappedActivationMilestoneRule {
  check(item: CappedActivationMilestone): string[];
}

export class CappedActivationMilestoneRequiredChannelRule implements CappedActivationMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedActivationMilestone): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class CappedActivationMilestoneLabelLengthRule implements CappedActivationMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedActivationMilestone): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedActivationMilestoneRequiredNotesRule implements CappedActivationMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedActivationMilestone): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

export class CappedActivationMilestoneCostRangeRule implements CappedActivationMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedActivationMilestone): string[] {
    const value = item.cost;
    if (value < this.min || value > this.max) return [`cost ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a capped activation milestone. */
export class CappedActivationMilestoneValidator {
  rules: CappedActivationMilestoneRule[];

  constructor(rules: CappedActivationMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: CappedActivationMilestone): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CappedActivationMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedActivationMilestone[]): Map<string, string[]> {
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

export function defaultCappedActivationMilestoneValidator(): CappedActivationMilestoneValidator {
  return new CappedActivationMilestoneValidator(
    [
      new CappedActivationMilestoneRequiredChannelRule("capped activation milestone needs an entry"),
      new CappedActivationMilestoneLabelLengthRule(3600),
      new CappedActivationMilestoneRequiredNotesRule("capped activation milestone needs this field"),
      new CappedActivationMilestoneCostRangeRule(1.9, 1703.6),
    ],
  );
}
