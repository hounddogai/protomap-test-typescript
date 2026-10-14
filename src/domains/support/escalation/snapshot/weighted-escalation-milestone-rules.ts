import { WeightedEscalationMilestone } from "./weighted-escalation-milestone.js";

/** A rule a weighted escalation milestone must pass. Check returns its problems, or none. */
export interface WeightedEscalationMilestoneRule {
  check(item: WeightedEscalationMilestone): string[];
}

export class WeightedEscalationMilestoneCodeLengthRule implements WeightedEscalationMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedEscalationMilestone): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedEscalationMilestoneThresholdRangeRule implements WeightedEscalationMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedEscalationMilestone): string[] {
    const value = item.threshold;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`threshold ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`threshold ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WeightedEscalationMilestoneRequiredAudienceIdRule implements WeightedEscalationMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedEscalationMilestone): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedEscalationMilestoneCodePrefixRule implements WeightedEscalationMilestoneRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WeightedEscalationMilestone): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WeightedEscalationMilestoneTitleLengthRule implements WeightedEscalationMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedEscalationMilestone): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a weighted escalation milestone. */
export class WeightedEscalationMilestoneValidator {
  rules: WeightedEscalationMilestoneRule[];

  constructor(rules: WeightedEscalationMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedEscalationMilestone): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedEscalationMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedEscalationMilestone[]): Map<string, string[]> {
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

export function defaultWeightedEscalationMilestoneValidator(): WeightedEscalationMilestoneValidator {
  return new WeightedEscalationMilestoneValidator(
    [
      new WeightedEscalationMilestoneCodeLengthRule(64),
      new WeightedEscalationMilestoneThresholdRangeRule(4.3, 3191.5),
      new WeightedEscalationMilestoneRequiredAudienceIdRule("weighted escalation milestone needs an entry"),
      new WeightedEscalationMilestoneCodePrefixRule("X"),
      new WeightedEscalationMilestoneTitleLengthRule(32),
    ],
  );
}
