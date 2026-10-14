import { RegionalChallengeProfile } from "./regional-challenge-profile.js";

/** A rule a regional challenge profile must pass. Check returns its problems, or none. */
export interface RegionalChallengeProfileRule {
  check(item: RegionalChallengeProfile): string[];
}

export class RegionalChallengeProfileRequiredLabelRule implements RegionalChallengeProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalChallengeProfile): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalChallengeProfileWindowDaysRangeRule implements RegionalChallengeProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalChallengeProfile): string[] {
    const value = item.windowDays;
    if (value < this.min || value > this.max) return [`window days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RegionalChallengeProfileCampaignRefLengthRule implements RegionalChallengeProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalChallengeProfile): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalChallengeProfileRequiredCountryRule implements RegionalChallengeProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalChallengeProfile): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a regional challenge profile. */
export class RegionalChallengeProfileValidator {
  rules: RegionalChallengeProfileRule[];

  constructor(rules: RegionalChallengeProfileRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalChallengeProfile): string[] {
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

  requireValid(item: RegionalChallengeProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalChallengeProfile[]): Map<string, string[]> {
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

export function defaultRegionalChallengeProfileValidator(): RegionalChallengeProfileValidator {
  return new RegionalChallengeProfileValidator(
    [
      new RegionalChallengeProfileRequiredLabelRule("regional challenge profile needs this field"),
      new RegionalChallengeProfileWindowDaysRangeRule(32, 3600),
      new RegionalChallengeProfileCampaignRefLengthRule(32),
      new RegionalChallengeProfileRequiredCountryRule("regional challenge profile needs an entry"),
    ],
  );
}
