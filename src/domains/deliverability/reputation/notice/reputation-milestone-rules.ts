import { ReputationMilestone } from "./reputation-milestone.js";

/** A rule a reputation milestone must pass. Check returns its problems, or none. */
export interface ReputationMilestoneRule {
  check(item: ReputationMilestone): string[];
}

export class ReputationMilestoneRequiredNameRule implements ReputationMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReputationMilestone): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class ReputationMilestoneAudienceIdLengthRule implements ReputationMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReputationMilestone): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ReputationMilestoneWeightRangeRule implements ReputationMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ReputationMilestone): string[] {
    const value = item.weight;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`weight ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`weight ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ReputationMilestoneJourneyIdLengthRule implements ReputationMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReputationMilestone): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a reputation milestone. */
export class ReputationMilestoneValidator {
  rules: ReputationMilestoneRule[];

  constructor(rules: ReputationMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: ReputationMilestone): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ReputationMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ReputationMilestone[]): Map<string, string[]> {
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

export function defaultReputationMilestoneValidator(): ReputationMilestoneValidator {
  return new ReputationMilestoneValidator(
    [
      new ReputationMilestoneRequiredNameRule("reputation milestone needs this field"),
      new ReputationMilestoneAudienceIdLengthRule(32),
      new ReputationMilestoneWeightRangeRule(9.2, 4233.4),
      new ReputationMilestoneJourneyIdLengthRule(64),
    ],
  );
}
