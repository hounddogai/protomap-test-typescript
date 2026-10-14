import { AdaptiveCsatMilestone } from "./adaptive-csat-milestone.js";

/** A rule a adaptive csat milestone must pass. Check returns its problems, or none. */
export interface AdaptiveCsatMilestoneRule {
  check(item: AdaptiveCsatMilestone): string[];
}

export class AdaptiveCsatMilestoneLimitRangeRule implements AdaptiveCsatMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveCsatMilestone): string[] {
    const value = item.limit;
    if (value < this.min || value > this.max) return [`limit ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class AdaptiveCsatMilestoneRequiredCodeRule implements AdaptiveCsatMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveCsatMilestone): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveCsatMilestoneRequiredTitleRule implements AdaptiveCsatMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveCsatMilestone): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a adaptive csat milestone. */
export class AdaptiveCsatMilestoneValidator {
  rules: AdaptiveCsatMilestoneRule[];

  constructor(rules: AdaptiveCsatMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveCsatMilestone): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptiveCsatMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveCsatMilestone[]): Map<string, string[]> {
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

export function defaultAdaptiveCsatMilestoneValidator(): AdaptiveCsatMilestoneValidator {
  return new AdaptiveCsatMilestoneValidator(
    [
      new AdaptiveCsatMilestoneLimitRangeRule(255, 1000),
      new AdaptiveCsatMilestoneRequiredCodeRule("adaptive csat milestone needs an entry"),
      new AdaptiveCsatMilestoneRequiredTitleRule("adaptive csat milestone needs a value"),
    ],
  );
}
