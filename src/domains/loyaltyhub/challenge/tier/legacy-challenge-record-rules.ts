import { LegacyChallengeRecord } from "./legacy-challenge-record.js";

/** A rule a legacy challenge record must pass. Check returns its problems, or none. */
export interface LegacyChallengeRecordRule {
  check(item: LegacyChallengeRecord): string[];
}

export class LegacyChallengeRecordLocaleLengthRule implements LegacyChallengeRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyChallengeRecord): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyChallengeRecordNameLengthRule implements LegacyChallengeRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyChallengeRecord): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyChallengeRecordImpressionsRangeRule implements LegacyChallengeRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyChallengeRecord): string[] {
    const value = item.impressions;
    if (value < this.min || value > this.max) return [`impressions ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LegacyChallengeRecordCreatedAtRangeRule implements LegacyChallengeRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyChallengeRecord): string[] {
    const value = item.createdAt;
    if (value < this.min || value > this.max) return [`created at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LegacyChallengeRecordCodeLengthRule implements LegacyChallengeRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyChallengeRecord): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a legacy challenge record. */
export class LegacyChallengeRecordValidator {
  rules: LegacyChallengeRecordRule[];

  constructor(rules: LegacyChallengeRecordRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyChallengeRecord): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacyChallengeRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyChallengeRecord[]): Map<string, string[]> {
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

export function defaultLegacyChallengeRecordValidator(): LegacyChallengeRecordValidator {
  return new LegacyChallengeRecordValidator(
    [
      new LegacyChallengeRecordLocaleLengthRule(255),
      new LegacyChallengeRecordNameLengthRule(1000),
      new LegacyChallengeRecordImpressionsRangeRule(255, 255),
      new LegacyChallengeRecordCreatedAtRangeRule(80, 255),
      new LegacyChallengeRecordCodeLengthRule(1000),
    ],
  );
}
