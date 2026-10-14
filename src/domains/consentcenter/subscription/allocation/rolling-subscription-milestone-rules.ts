import { RollingSubscriptionMilestone } from "./rolling-subscription-milestone.js";

/** A rule a rolling subscription milestone must pass. Check returns its problems, or none. */
export interface RollingSubscriptionMilestoneRule {
  check(item: RollingSubscriptionMilestone): string[];
}

export class RollingSubscriptionMilestoneTitleLengthRule implements RollingSubscriptionMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingSubscriptionMilestone): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingSubscriptionMilestoneJourneyIdLengthRule implements RollingSubscriptionMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingSubscriptionMilestone): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingSubscriptionMilestoneCostRangeRule implements RollingSubscriptionMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingSubscriptionMilestone): string[] {
    const value = item.cost;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`cost ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`cost ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RollingSubscriptionMilestoneCodePrefixRule implements RollingSubscriptionMilestoneRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RollingSubscriptionMilestone): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RollingSubscriptionMilestoneRequiredChannelRule implements RollingSubscriptionMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingSubscriptionMilestone): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a rolling subscription milestone. */
export class RollingSubscriptionMilestoneValidator {
  rules: RollingSubscriptionMilestoneRule[];

  constructor(rules: RollingSubscriptionMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: RollingSubscriptionMilestone): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingSubscriptionMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingSubscriptionMilestone[]): Map<string, string[]> {
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

export function defaultRollingSubscriptionMilestoneValidator(): RollingSubscriptionMilestoneValidator {
  return new RollingSubscriptionMilestoneValidator(
    [
      new RollingSubscriptionMilestoneTitleLengthRule(1000),
      new RollingSubscriptionMilestoneJourneyIdLengthRule(1000),
      new RollingSubscriptionMilestoneCostRangeRule(0.6, 3953.2),
      new RollingSubscriptionMilestoneCodePrefixRule("X"),
      new RollingSubscriptionMilestoneRequiredChannelRule("rolling subscription milestone needs a value"),
    ],
  );
}
