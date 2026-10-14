import { SeasonalInviteMilestone } from "./seasonal-invite-milestone.js";

/** A rule a seasonal invite milestone must pass. Check returns its problems, or none. */
export interface SeasonalInviteMilestoneRule {
  check(item: SeasonalInviteMilestone): string[];
}

export class SeasonalInviteMilestoneFrequencyCapRangeRule implements SeasonalInviteMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalInviteMilestone): string[] {
    const value = item.frequencyCap;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`frequency cap ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`frequency cap ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SeasonalInviteMilestoneCodeLengthRule implements SeasonalInviteMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalInviteMilestone): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalInviteMilestoneTitleLengthRule implements SeasonalInviteMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalInviteMilestone): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalInviteMilestoneRequiredCodeRule implements SeasonalInviteMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalInviteMilestone): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a seasonal invite milestone. */
export class SeasonalInviteMilestoneValidator {
  rules: SeasonalInviteMilestoneRule[];

  constructor(rules: SeasonalInviteMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalInviteMilestone): string[] {
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

  requireValid(item: SeasonalInviteMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalInviteMilestone[]): Map<string, string[]> {
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

export function defaultSeasonalInviteMilestoneValidator(): SeasonalInviteMilestoneValidator {
  return new SeasonalInviteMilestoneValidator(
    [
      new SeasonalInviteMilestoneFrequencyCapRangeRule(1000, 3600),
      new SeasonalInviteMilestoneCodeLengthRule(255),
      new SeasonalInviteMilestoneTitleLengthRule(64),
      new SeasonalInviteMilestoneRequiredCodeRule("seasonal invite milestone needs an entry"),
    ],
  );
}
