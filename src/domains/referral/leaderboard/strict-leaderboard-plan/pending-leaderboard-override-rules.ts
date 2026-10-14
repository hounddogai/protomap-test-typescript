import { PendingLeaderboardOverride } from "./pending-leaderboard-override.js";

/** A rule a pending leaderboard override must pass. Check returns its problems, or none. */
export interface PendingLeaderboardOverrideRule {
  check(item: PendingLeaderboardOverride): string[];
}

export class PendingLeaderboardOverrideRequiredVariantRule implements PendingLeaderboardOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingLeaderboardOverride): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

export class PendingLeaderboardOverrideLabelLengthRule implements PendingLeaderboardOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingLeaderboardOverride): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingLeaderboardOverrideCodeLengthRule implements PendingLeaderboardOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingLeaderboardOverride): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingLeaderboardOverrideAudienceIdLengthRule implements PendingLeaderboardOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingLeaderboardOverride): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingLeaderboardOverrideRatioRangeRule implements PendingLeaderboardOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingLeaderboardOverride): string[] {
    const value = item.ratio;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ratio ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ratio ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PendingLeaderboardOverrideDurationMinutesRangeRule implements PendingLeaderboardOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingLeaderboardOverride): string[] {
    const value = item.durationMinutes;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`duration minutes ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`duration minutes ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a pending leaderboard override. */
export class PendingLeaderboardOverrideValidator {
  rules: PendingLeaderboardOverrideRule[];

  constructor(rules: PendingLeaderboardOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: PendingLeaderboardOverride): string[] {
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

  requireValid(item: PendingLeaderboardOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingLeaderboardOverride[]): Map<string, string[]> {
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

export function defaultPendingLeaderboardOverrideValidator(): PendingLeaderboardOverrideValidator {
  return new PendingLeaderboardOverrideValidator(
    [
      new PendingLeaderboardOverrideRequiredVariantRule("pending leaderboard override needs this field"),
      new PendingLeaderboardOverrideLabelLengthRule(1000),
      new PendingLeaderboardOverrideCodeLengthRule(16),
      new PendingLeaderboardOverrideAudienceIdLengthRule(80),
      new PendingLeaderboardOverrideRatioRangeRule(2.8, 776.6),
      new PendingLeaderboardOverrideDurationMinutesRangeRule(1000, 3600),
    ],
  );
}
