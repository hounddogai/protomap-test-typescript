import { StrictJourneyDigest } from "./strict-journey-digest.js";

/** A rule a strict journey digest must pass. Check returns its problems, or none. */
export interface StrictJourneyDigestRule {
  check(item: StrictJourneyDigest): string[];
}

export class StrictJourneyDigestApprovedGuardRule implements StrictJourneyDigestRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: StrictJourneyDigest): string[] {
    if (item.approved && item.expiresAt > this.limit) return [`expires at ${item.expiresAt} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class StrictJourneyDigestDurationMinutesRangeRule implements StrictJourneyDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictJourneyDigest): string[] {
    const value = item.durationMinutes;
    if (value < this.min || value > this.max) return [`duration minutes ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StrictJourneyDigestRequiredCodeRule implements StrictJourneyDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictJourneyDigest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class StrictJourneyDigestCodeLengthRule implements StrictJourneyDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictJourneyDigest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a strict journey digest. */
export class StrictJourneyDigestValidator {
  rules: StrictJourneyDigestRule[];

  constructor(rules: StrictJourneyDigestRule[]) {
    this.rules = rules;
  }

  validate(item: StrictJourneyDigest): string[] {
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

  requireValid(item: StrictJourneyDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictJourneyDigest[]): Map<string, string[]> {
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

export function defaultStrictJourneyDigestValidator(): StrictJourneyDigestValidator {
  return new StrictJourneyDigestValidator(
    [
      new StrictJourneyDigestApprovedGuardRule(3600),
      new StrictJourneyDigestDurationMinutesRangeRule(80, 255),
      new StrictJourneyDigestRequiredCodeRule("strict journey digest needs this field"),
      new StrictJourneyDigestCodeLengthRule(32),
    ],
  );
}
