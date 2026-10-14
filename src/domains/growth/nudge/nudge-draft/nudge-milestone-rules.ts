import { NudgeMilestone } from "./nudge-milestone.js";

/** A rule a nudge milestone must pass. Check returns its problems, or none. */
export interface NudgeMilestoneRule {
  check(item: NudgeMilestone): string[];
}

export class NudgeMilestoneRequiredCodeRule implements NudgeMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: NudgeMilestone): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class NudgeMilestoneChannelLengthRule implements NudgeMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: NudgeMilestone): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class NudgeMilestoneRequiredChannelRule implements NudgeMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: NudgeMilestone): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class NudgeMilestoneRequiredLabelRule implements NudgeMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: NudgeMilestone): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a nudge milestone. */
export class NudgeMilestoneValidator {
  rules: NudgeMilestoneRule[];

  constructor(rules: NudgeMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: NudgeMilestone): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: NudgeMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: NudgeMilestone[]): Map<string, string[]> {
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

export function defaultNudgeMilestoneValidator(): NudgeMilestoneValidator {
  return new NudgeMilestoneValidator(
    [
      new NudgeMilestoneRequiredCodeRule("nudge milestone needs this field"),
      new NudgeMilestoneChannelLengthRule(32),
      new NudgeMilestoneRequiredChannelRule("nudge milestone needs this field"),
      new NudgeMilestoneRequiredLabelRule("nudge milestone needs this field"),
    ],
  );
}
