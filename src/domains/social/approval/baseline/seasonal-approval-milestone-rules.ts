import { SeasonalApprovalMilestone } from "./seasonal-approval-milestone.js";

/** A rule a seasonal approval milestone must pass. Check returns its problems, or none. */
export interface SeasonalApprovalMilestoneRule {
  check(item: SeasonalApprovalMilestone): string[];
}

export class SeasonalApprovalMilestoneCeilingRangeRule implements SeasonalApprovalMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalApprovalMilestone): string[] {
    const value = item.ceiling;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ceiling ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ceiling ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SeasonalApprovalMilestoneWindowDaysRangeRule implements SeasonalApprovalMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalApprovalMilestone): string[] {
    const value = item.windowDays;
    if (value < this.min || value > this.max) return [`window days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SeasonalApprovalMilestoneImpressionsRangeRule implements SeasonalApprovalMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalApprovalMilestone): string[] {
    const value = item.impressions;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`impressions ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`impressions ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a seasonal approval milestone. */
export class SeasonalApprovalMilestoneValidator {
  rules: SeasonalApprovalMilestoneRule[];

  constructor(rules: SeasonalApprovalMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalApprovalMilestone): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SeasonalApprovalMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalApprovalMilestone[]): Map<string, string[]> {
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

export function defaultSeasonalApprovalMilestoneValidator(): SeasonalApprovalMilestoneValidator {
  return new SeasonalApprovalMilestoneValidator(
    [
      new SeasonalApprovalMilestoneCeilingRangeRule(7.5, 2298.1),
      new SeasonalApprovalMilestoneWindowDaysRangeRule(16, 1000),
      new SeasonalApprovalMilestoneImpressionsRangeRule(32, 255),
    ],
  );
}
