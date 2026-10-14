import { DoubleOptInProfile } from "./double-opt-in-profile.js";

/** A rule a double opt in profile must pass. Check returns its problems, or none. */
export interface DoubleOptInProfileRule {
  check(item: DoubleOptInProfile): string[];
}

export class DoubleOptInProfileDurationMinutesRangeRule implements DoubleOptInProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DoubleOptInProfile): string[] {
    const value = item.durationMinutes;
    if (value < this.min || value > this.max) return [`duration minutes ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DoubleOptInProfileRetriesRangeRule implements DoubleOptInProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DoubleOptInProfile): string[] {
    const value = item.retries;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`retries ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`retries ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DoubleOptInProfileBidRangeRule implements DoubleOptInProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DoubleOptInProfile): string[] {
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

export class DoubleOptInProfileRequiredReviewerRule implements DoubleOptInProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DoubleOptInProfile): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a double opt in profile. */
export class DoubleOptInProfileValidator {
  rules: DoubleOptInProfileRule[];

  constructor(rules: DoubleOptInProfileRule[]) {
    this.rules = rules;
  }

  validate(item: DoubleOptInProfile): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DoubleOptInProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DoubleOptInProfile[]): Map<string, string[]> {
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

export function defaultDoubleOptInProfileValidator(): DoubleOptInProfileValidator {
  return new DoubleOptInProfileValidator(
    [
      new DoubleOptInProfileDurationMinutesRangeRule(255, 86400),
      new DoubleOptInProfileRetriesRangeRule(64, 64),
      new DoubleOptInProfileBidRangeRule(6, 4208.5),
      new DoubleOptInProfileRequiredReviewerRule("double opt in profile needs an entry"),
    ],
  );
}
