import { SeasonalSenderMilestone } from "./seasonal-sender-milestone.js";

/** A rule a seasonal sender milestone must pass. Check returns its problems, or none. */
export interface SeasonalSenderMilestoneRule {
  check(item: SeasonalSenderMilestone): string[];
}

export class SeasonalSenderMilestoneRequiredCodeRule implements SeasonalSenderMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalSenderMilestone): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalSenderMilestoneEndsAtRangeRule implements SeasonalSenderMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalSenderMilestone): string[] {
    const value = item.endsAt;
    if (value < this.min || value > this.max) return [`ends at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SeasonalSenderMilestoneRequiredReviewerRule implements SeasonalSenderMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalSenderMilestone): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalSenderMilestoneRequiredLabelRule implements SeasonalSenderMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalSenderMilestone): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalSenderMilestoneReviewerLengthRule implements SeasonalSenderMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalSenderMilestone): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a seasonal sender milestone. */
export class SeasonalSenderMilestoneValidator {
  rules: SeasonalSenderMilestoneRule[];

  constructor(rules: SeasonalSenderMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalSenderMilestone): string[] {
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

  requireValid(item: SeasonalSenderMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalSenderMilestone[]): Map<string, string[]> {
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

export function defaultSeasonalSenderMilestoneValidator(): SeasonalSenderMilestoneValidator {
  return new SeasonalSenderMilestoneValidator(
    [
      new SeasonalSenderMilestoneRequiredCodeRule("seasonal sender milestone needs a value"),
      new SeasonalSenderMilestoneEndsAtRangeRule(32, 32),
      new SeasonalSenderMilestoneRequiredReviewerRule("seasonal sender milestone needs a value"),
      new SeasonalSenderMilestoneRequiredLabelRule("seasonal sender milestone needs a value"),
      new SeasonalSenderMilestoneReviewerLengthRule(32),
    ],
  );
}
