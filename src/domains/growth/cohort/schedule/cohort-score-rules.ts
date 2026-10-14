import { CohortScore } from "./cohort-score.js";

/** A rule a cohort score must pass. Check returns its problems, or none. */
export interface CohortScoreRule {
  check(item: CohortScore): string[];
}

export class CohortScoreRequiredCampaignRefRule implements CohortScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CohortScore): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class CohortScoreWindowDaysRangeRule implements CohortScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CohortScore): string[] {
    const value = item.windowDays;
    if (value < this.min || value > this.max) return [`window days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CohortScoreChecksumLengthRule implements CohortScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CohortScore): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CohortScoreRequiredTitleRule implements CohortScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CohortScore): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class CohortScoreCampaignRefLengthRule implements CohortScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CohortScore): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a cohort score. */
export class CohortScoreValidator {
  rules: CohortScoreRule[];

  constructor(rules: CohortScoreRule[]) {
    this.rules = rules;
  }

  validate(item: CohortScore): string[] {
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

  requireValid(item: CohortScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CohortScore[]): Map<string, string[]> {
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

export function defaultCohortScoreValidator(): CohortScoreValidator {
  return new CohortScoreValidator(
    [
      new CohortScoreRequiredCampaignRefRule("cohort score needs an entry"),
      new CohortScoreWindowDaysRangeRule(64, 86400),
      new CohortScoreChecksumLengthRule(32),
      new CohortScoreRequiredTitleRule("cohort score needs an entry"),
      new CohortScoreCampaignRefLengthRule(16),
    ],
  );
}
