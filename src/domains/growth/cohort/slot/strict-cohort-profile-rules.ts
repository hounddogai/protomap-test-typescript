import { StrictCohortProfile } from "./strict-cohort-profile.js";

/** A rule a strict cohort profile must pass. Check returns its problems, or none. */
export interface StrictCohortProfileRule {
  check(item: StrictCohortProfile): string[];
}

export class StrictCohortProfileBatchSizeRangeRule implements StrictCohortProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictCohortProfile): string[] {
    const value = item.batchSize;
    if (value < this.min || value > this.max) return [`batch size ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StrictCohortProfileOpenRateRangeRule implements StrictCohortProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictCohortProfile): string[] {
    const value = item.openRate;
    if (value < this.min || value > this.max) return [`open rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StrictCohortProfileRequiredChannelRule implements StrictCohortProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictCohortProfile): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a strict cohort profile. */
export class StrictCohortProfileValidator {
  rules: StrictCohortProfileRule[];

  constructor(rules: StrictCohortProfileRule[]) {
    this.rules = rules;
  }

  validate(item: StrictCohortProfile): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StrictCohortProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictCohortProfile[]): Map<string, string[]> {
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

export function defaultStrictCohortProfileValidator(): StrictCohortProfileValidator {
  return new StrictCohortProfileValidator(
    [
      new StrictCohortProfileBatchSizeRangeRule(64, 3600),
      new StrictCohortProfileOpenRateRangeRule(7.7, 1126.5),
      new StrictCohortProfileRequiredChannelRule("strict cohort profile needs this field"),
    ],
  );
}
