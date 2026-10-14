import { SeasonalLeaderboardAgreement } from "./seasonal-leaderboard-agreement.js";

/** A rule a seasonal leaderboard agreement must pass. Check returns its problems, or none. */
export interface SeasonalLeaderboardAgreementRule {
  check(item: SeasonalLeaderboardAgreement): string[];
}

export class SeasonalLeaderboardAgreementRequiredNameRule implements SeasonalLeaderboardAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalLeaderboardAgreement): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalLeaderboardAgreementMaximumRangeRule implements SeasonalLeaderboardAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalLeaderboardAgreement): string[] {
    const value = item.maximum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`maximum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`maximum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SeasonalLeaderboardAgreementBidRangeRule implements SeasonalLeaderboardAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalLeaderboardAgreement): string[] {
    const value = item.bid;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`bid ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`bid ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SeasonalLeaderboardAgreementBatchSizeRangeRule implements SeasonalLeaderboardAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalLeaderboardAgreement): string[] {
    const value = item.batchSize;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`batch size ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`batch size ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SeasonalLeaderboardAgreementCodePrefixRule implements SeasonalLeaderboardAgreementRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SeasonalLeaderboardAgreement): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a seasonal leaderboard agreement. */
export class SeasonalLeaderboardAgreementValidator {
  rules: SeasonalLeaderboardAgreementRule[];

  constructor(rules: SeasonalLeaderboardAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalLeaderboardAgreement): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SeasonalLeaderboardAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalLeaderboardAgreement[]): Map<string, string[]> {
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

export function defaultSeasonalLeaderboardAgreementValidator(): SeasonalLeaderboardAgreementValidator {
  return new SeasonalLeaderboardAgreementValidator(
    [
      new SeasonalLeaderboardAgreementRequiredNameRule("seasonal leaderboard agreement needs a value"),
      new SeasonalLeaderboardAgreementMaximumRangeRule(9.2, 2613.3),
      new SeasonalLeaderboardAgreementBidRangeRule(3.5, 3327.9),
      new SeasonalLeaderboardAgreementBatchSizeRangeRule(80, 3600),
      new SeasonalLeaderboardAgreementCodePrefixRule("X"),
    ],
  );
}
