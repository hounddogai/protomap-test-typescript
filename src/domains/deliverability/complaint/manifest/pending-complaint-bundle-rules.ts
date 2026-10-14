import { PendingComplaintBundle } from "./pending-complaint-bundle.js";

/** A rule a pending complaint bundle must pass. Check returns its problems, or none. */
export interface PendingComplaintBundleRule {
  check(item: PendingComplaintBundle): string[];
}

export class PendingComplaintBundleJourneyIdLengthRule implements PendingComplaintBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingComplaintBundle): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingComplaintBundleScoreRangeRule implements PendingComplaintBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingComplaintBundle): string[] {
    const value = item.score;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`score ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`score ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PendingComplaintBundleRequiredCodeRule implements PendingComplaintBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingComplaintBundle): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a pending complaint bundle. */
export class PendingComplaintBundleValidator {
  rules: PendingComplaintBundleRule[];

  constructor(rules: PendingComplaintBundleRule[]) {
    this.rules = rules;
  }

  validate(item: PendingComplaintBundle): string[] {
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

  requireValid(item: PendingComplaintBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingComplaintBundle[]): Map<string, string[]> {
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

export function defaultPendingComplaintBundleValidator(): PendingComplaintBundleValidator {
  return new PendingComplaintBundleValidator(
    [
      new PendingComplaintBundleJourneyIdLengthRule(1000),
      new PendingComplaintBundleScoreRangeRule(7.6, 293.3),
      new PendingComplaintBundleRequiredCodeRule("pending complaint bundle needs a value"),
    ],
  );
}
