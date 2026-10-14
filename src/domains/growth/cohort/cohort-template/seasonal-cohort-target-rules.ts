import * as text from "../../../../kit/text.js";
import { SeasonalCohortTarget } from "./seasonal-cohort-target.js";

/** A rule a seasonal cohort target must pass. Check returns its problems, or none. */
export interface SeasonalCohortTargetRule {
  check(item: SeasonalCohortTarget): string[];
}

export class SeasonalCohortTargetAllowedRegionRule implements SeasonalCohortTargetRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SeasonalCohortTarget): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.region))) return [`region ${item.region} is too long`];
    return [];
  }
}

export class SeasonalCohortTargetRequiredTitleRule implements SeasonalCohortTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalCohortTarget): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalCohortTargetCountryLengthRule implements SeasonalCohortTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalCohortTarget): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalCohortTargetRequiredCodeRule implements SeasonalCohortTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalCohortTarget): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalCohortTargetRegionLengthRule implements SeasonalCohortTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalCohortTarget): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a seasonal cohort target. */
export class SeasonalCohortTargetValidator {
  rules: SeasonalCohortTargetRule[];

  constructor(rules: SeasonalCohortTargetRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalCohortTarget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SeasonalCohortTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalCohortTarget[]): Map<string, string[]> {
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

export function defaultSeasonalCohortTargetValidator(): SeasonalCohortTargetValidator {
  return new SeasonalCohortTargetValidator(
    [
      new SeasonalCohortTargetAllowedRegionRule(["scheduled", "manual", "capped"]),
      new SeasonalCohortTargetRequiredTitleRule("seasonal cohort target needs this field"),
      new SeasonalCohortTargetCountryLengthRule(64),
      new SeasonalCohortTargetRequiredCodeRule("seasonal cohort target needs an entry"),
      new SeasonalCohortTargetRegionLengthRule(16),
    ],
  );
}
