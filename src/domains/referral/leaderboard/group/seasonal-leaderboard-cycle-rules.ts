import { SeasonalLeaderboardCycle } from "./seasonal-leaderboard-cycle.js";

/** A rule a seasonal leaderboard cycle must pass. Check returns its problems, or none. */
export interface SeasonalLeaderboardCycleRule {
  check(item: SeasonalLeaderboardCycle): string[];
}

export class SeasonalLeaderboardCycleLabelLengthRule implements SeasonalLeaderboardCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalLeaderboardCycle): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalLeaderboardCycleRequiredLabelRule implements SeasonalLeaderboardCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalLeaderboardCycle): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalLeaderboardCycleCodePrefixRule implements SeasonalLeaderboardCycleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SeasonalLeaderboardCycle): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SeasonalLeaderboardCycleCodeLengthRule implements SeasonalLeaderboardCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalLeaderboardCycle): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a seasonal leaderboard cycle. */
export class SeasonalLeaderboardCycleValidator {
  rules: SeasonalLeaderboardCycleRule[];

  constructor(rules: SeasonalLeaderboardCycleRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalLeaderboardCycle): string[] {
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

  requireValid(item: SeasonalLeaderboardCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalLeaderboardCycle[]): Map<string, string[]> {
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

export function defaultSeasonalLeaderboardCycleValidator(): SeasonalLeaderboardCycleValidator {
  return new SeasonalLeaderboardCycleValidator(
    [
      new SeasonalLeaderboardCycleLabelLengthRule(16),
      new SeasonalLeaderboardCycleRequiredLabelRule("seasonal leaderboard cycle needs an entry"),
      new SeasonalLeaderboardCycleCodePrefixRule("OPS"),
      new SeasonalLeaderboardCycleCodeLengthRule(86400),
    ],
  );
}
