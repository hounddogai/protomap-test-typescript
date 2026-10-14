import { RegionalDoubleOptInMilestone } from "./regional-double-opt-in-milestone.js";

/** A rule a regional double opt in milestone must pass. Check returns its problems, or none. */
export interface RegionalDoubleOptInMilestoneRule {
  check(item: RegionalDoubleOptInMilestone): string[];
}

export class RegionalDoubleOptInMilestoneRequiredCategoryRule implements RegionalDoubleOptInMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalDoubleOptInMilestone): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalDoubleOptInMilestoneRequiredNameRule implements RegionalDoubleOptInMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalDoubleOptInMilestone): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalDoubleOptInMilestoneGraceDaysRangeRule implements RegionalDoubleOptInMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalDoubleOptInMilestone): string[] {
    const value = item.graceDays;
    if (value < this.min || value > this.max) return [`grace days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RegionalDoubleOptInMilestoneScoreRangeRule implements RegionalDoubleOptInMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalDoubleOptInMilestone): string[] {
    const value = item.score;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`score ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`score ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RegionalDoubleOptInMilestoneUpdatedAtRangeRule implements RegionalDoubleOptInMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalDoubleOptInMilestone): string[] {
    const value = item.updatedAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`updated at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`updated at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a regional double opt in milestone. */
export class RegionalDoubleOptInMilestoneValidator {
  rules: RegionalDoubleOptInMilestoneRule[];

  constructor(rules: RegionalDoubleOptInMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalDoubleOptInMilestone): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RegionalDoubleOptInMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalDoubleOptInMilestone[]): Map<string, string[]> {
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

export function defaultRegionalDoubleOptInMilestoneValidator(): RegionalDoubleOptInMilestoneValidator {
  return new RegionalDoubleOptInMilestoneValidator(
    [
      new RegionalDoubleOptInMilestoneRequiredCategoryRule("regional double opt in milestone needs an entry"),
      new RegionalDoubleOptInMilestoneRequiredNameRule("regional double opt in milestone needs this field"),
      new RegionalDoubleOptInMilestoneGraceDaysRangeRule(64, 255),
      new RegionalDoubleOptInMilestoneScoreRangeRule(0.2, 2681.3),
      new RegionalDoubleOptInMilestoneUpdatedAtRangeRule(16, 86400),
    ],
  );
}
