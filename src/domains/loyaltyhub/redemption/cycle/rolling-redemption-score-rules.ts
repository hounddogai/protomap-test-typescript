import { RollingRedemptionScore } from "./rolling-redemption-score.js";

/** A rule a rolling redemption score must pass. Check returns its problems, or none. */
export interface RollingRedemptionScoreRule {
  check(item: RollingRedemptionScore): string[];
}

export class RollingRedemptionScoreCodeLengthRule implements RollingRedemptionScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingRedemptionScore): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingRedemptionScoreScoreRangeRule implements RollingRedemptionScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingRedemptionScore): string[] {
    const value = item.score;
    if (value < this.min || value > this.max) return [`score ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RollingRedemptionScoreRequiredUtmSourceRule implements RollingRedemptionScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingRedemptionScore): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

export class RollingRedemptionScorePinnedGuardRule implements RollingRedemptionScoreRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: RollingRedemptionScore): string[] {
    if (item.pinned && item.budget > this.limit) return [`budget ${item.budget} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class RollingRedemptionScoreUtmSourceLengthRule implements RollingRedemptionScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingRedemptionScore): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a rolling redemption score. */
export class RollingRedemptionScoreValidator {
  rules: RollingRedemptionScoreRule[];

  constructor(rules: RollingRedemptionScoreRule[]) {
    this.rules = rules;
  }

  validate(item: RollingRedemptionScore): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingRedemptionScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingRedemptionScore[]): Map<string, string[]> {
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

export function defaultRollingRedemptionScoreValidator(): RollingRedemptionScoreValidator {
  return new RollingRedemptionScoreValidator(
    [
      new RollingRedemptionScoreCodeLengthRule(80),
      new RollingRedemptionScoreScoreRangeRule(7.3, 4876.9),
      new RollingRedemptionScoreRequiredUtmSourceRule("rolling redemption score needs this field"),
      new RollingRedemptionScorePinnedGuardRule(1.8),
      new RollingRedemptionScoreUtmSourceLengthRule(80),
    ],
  );
}
