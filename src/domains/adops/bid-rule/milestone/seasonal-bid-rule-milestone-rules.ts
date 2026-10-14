import { SeasonalBidRuleMilestone } from "./seasonal-bid-rule-milestone.js";

/** A rule a seasonal bid rule milestone must pass. Check returns its problems, or none. */
export interface SeasonalBidRuleMilestoneRule {
  check(item: SeasonalBidRuleMilestone): string[];
}

export class SeasonalBidRuleMilestoneRequiredChecksumRule implements SeasonalBidRuleMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalBidRuleMilestone): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalBidRuleMilestoneCategoryLengthRule implements SeasonalBidRuleMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalBidRuleMilestone): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalBidRuleMilestoneChecksumLengthRule implements SeasonalBidRuleMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalBidRuleMilestone): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalBidRuleMilestoneVisibleGuardRule implements SeasonalBidRuleMilestoneRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: SeasonalBidRuleMilestone): string[] {
    if (item.visible && item.bid > this.limit) return [`bid ${item.bid} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class SeasonalBidRuleMilestoneRequiredTitleRule implements SeasonalBidRuleMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalBidRuleMilestone): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a seasonal bid rule milestone. */
export class SeasonalBidRuleMilestoneValidator {
  rules: SeasonalBidRuleMilestoneRule[];

  constructor(rules: SeasonalBidRuleMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalBidRuleMilestone): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SeasonalBidRuleMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalBidRuleMilestone[]): Map<string, string[]> {
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

export function defaultSeasonalBidRuleMilestoneValidator(): SeasonalBidRuleMilestoneValidator {
  return new SeasonalBidRuleMilestoneValidator(
    [
      new SeasonalBidRuleMilestoneRequiredChecksumRule("seasonal bid rule milestone needs a value"),
      new SeasonalBidRuleMilestoneCategoryLengthRule(80),
      new SeasonalBidRuleMilestoneChecksumLengthRule(86400),
      new SeasonalBidRuleMilestoneVisibleGuardRule(1.3),
      new SeasonalBidRuleMilestoneRequiredTitleRule("seasonal bid rule milestone needs this field"),
    ],
  );
}
