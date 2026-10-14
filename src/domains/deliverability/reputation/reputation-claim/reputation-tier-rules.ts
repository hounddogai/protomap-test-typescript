import { ReputationTier } from "./reputation-tier.js";

/** A rule a reputation tier must pass. Check returns its problems, or none. */
export interface ReputationTierRule {
  check(item: ReputationTier): string[];
}

export class ReputationTierDurationMinutesRangeRule implements ReputationTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ReputationTier): string[] {
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

export class ReputationTierTitleLengthRule implements ReputationTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReputationTier): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ReputationTierRequiredCodeRule implements ReputationTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReputationTier): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ReputationTierCodeLengthRule implements ReputationTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReputationTier): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ReputationTierRequiredCohortRule implements ReputationTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReputationTier): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a reputation tier. */
export class ReputationTierValidator {
  rules: ReputationTierRule[];

  constructor(rules: ReputationTierRule[]) {
    this.rules = rules;
  }

  validate(item: ReputationTier): string[] {
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

  requireValid(item: ReputationTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ReputationTier[]): Map<string, string[]> {
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

export function defaultReputationTierValidator(): ReputationTierValidator {
  return new ReputationTierValidator(
    [
      new ReputationTierDurationMinutesRangeRule(32, 120),
      new ReputationTierTitleLengthRule(64),
      new ReputationTierRequiredCodeRule("reputation tier needs a value"),
      new ReputationTierCodeLengthRule(86400),
      new ReputationTierRequiredCohortRule("reputation tier needs a value"),
    ],
  );
}
