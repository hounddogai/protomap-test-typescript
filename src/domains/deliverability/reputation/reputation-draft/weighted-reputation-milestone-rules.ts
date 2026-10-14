import { WeightedReputationMilestone } from "./weighted-reputation-milestone.js";

/** A rule a weighted reputation milestone must pass. Check returns its problems, or none. */
export interface WeightedReputationMilestoneRule {
  check(item: WeightedReputationMilestone): string[];
}

export class WeightedReputationMilestoneRegionLengthRule implements WeightedReputationMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedReputationMilestone): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedReputationMilestoneRequiredRegionRule implements WeightedReputationMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedReputationMilestone): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedReputationMilestoneNameLengthRule implements WeightedReputationMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedReputationMilestone): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedReputationMilestoneRequiredCountryRule implements WeightedReputationMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedReputationMilestone): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedReputationMilestoneWindowRule implements WeightedReputationMilestoneRule {
  maxSpan: number;

  constructor(maxSpan: number) {
    this.maxSpan = maxSpan;
  }

  check(item: WeightedReputationMilestone): string[] {
    if (item.startsAt > item.endsAt) return ["starts at is after ends at"];
    if (this.maxSpan > 0 && item.endsAt - item.startsAt > this.maxSpan) return [`spans more than ${this.maxSpan} seconds`];
    return [];
  }
}

/** Runs every rule of a weighted reputation milestone. */
export class WeightedReputationMilestoneValidator {
  rules: WeightedReputationMilestoneRule[];

  constructor(rules: WeightedReputationMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedReputationMilestone): string[] {
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

  requireValid(item: WeightedReputationMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedReputationMilestone[]): Map<string, string[]> {
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

export function defaultWeightedReputationMilestoneValidator(): WeightedReputationMilestoneValidator {
  return new WeightedReputationMilestoneValidator(
    [
      new WeightedReputationMilestoneRegionLengthRule(80),
      new WeightedReputationMilestoneRequiredRegionRule("weighted reputation milestone needs this field"),
      new WeightedReputationMilestoneNameLengthRule(3600),
      new WeightedReputationMilestoneRequiredCountryRule("weighted reputation milestone needs this field"),
      new WeightedReputationMilestoneWindowRule(120),
    ],
  );
}
