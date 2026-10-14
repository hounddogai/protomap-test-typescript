import { EnrollmentScore } from "./enrollment-score.js";

/** A rule a enrollment score must pass. Check returns its problems, or none. */
export interface EnrollmentScoreRule {
  check(item: EnrollmentScore): string[];
}

export class EnrollmentScoreAudienceIdLengthRule implements EnrollmentScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EnrollmentScore): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class EnrollmentScoreRequiredAudienceIdRule implements EnrollmentScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EnrollmentScore): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

export class EnrollmentScoreBidRangeRule implements EnrollmentScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EnrollmentScore): string[] {
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

export class EnrollmentScoreLabelLengthRule implements EnrollmentScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EnrollmentScore): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a enrollment score. */
export class EnrollmentScoreValidator {
  rules: EnrollmentScoreRule[];

  constructor(rules: EnrollmentScoreRule[]) {
    this.rules = rules;
  }

  validate(item: EnrollmentScore): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: EnrollmentScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: EnrollmentScore[]): Map<string, string[]> {
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

export function defaultEnrollmentScoreValidator(): EnrollmentScoreValidator {
  return new EnrollmentScoreValidator(
    [
      new EnrollmentScoreAudienceIdLengthRule(3600),
      new EnrollmentScoreRequiredAudienceIdRule("enrollment score needs a value"),
      new EnrollmentScoreBidRangeRule(5.4, 4709.2),
      new EnrollmentScoreLabelLengthRule(32),
    ],
  );
}
