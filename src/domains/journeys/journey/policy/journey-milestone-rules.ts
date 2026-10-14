import { JourneyMilestone } from "./journey-milestone.js";

/** A rule a journey milestone must pass. Check returns its problems, or none. */
export interface JourneyMilestoneRule {
  check(item: JourneyMilestone): string[];
}

export class JourneyMilestoneCohortLengthRule implements JourneyMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: JourneyMilestone): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class JourneyMilestoneRequiredChannelRule implements JourneyMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: JourneyMilestone): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class JourneyMilestoneRequiredCodeRule implements JourneyMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: JourneyMilestone): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a journey milestone. */
export class JourneyMilestoneValidator {
  rules: JourneyMilestoneRule[];

  constructor(rules: JourneyMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: JourneyMilestone): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: JourneyMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: JourneyMilestone[]): Map<string, string[]> {
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

export function defaultJourneyMilestoneValidator(): JourneyMilestoneValidator {
  return new JourneyMilestoneValidator(
    [
      new JourneyMilestoneCohortLengthRule(3600),
      new JourneyMilestoneRequiredChannelRule("journey milestone needs a value"),
      new JourneyMilestoneRequiredCodeRule("journey milestone needs a value"),
    ],
  );
}
