import { LegacyDoubleOptInSegment } from "./legacy-double-opt-in-segment.js";

/** A rule a legacy double opt in segment must pass. Check returns its problems, or none. */
export interface LegacyDoubleOptInSegmentRule {
  check(item: LegacyDoubleOptInSegment): string[];
}

export class LegacyDoubleOptInSegmentDurationMinutesRangeRule implements LegacyDoubleOptInSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyDoubleOptInSegment): string[] {
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

export class LegacyDoubleOptInSegmentCampaignRefLengthRule implements LegacyDoubleOptInSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyDoubleOptInSegment): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyDoubleOptInSegmentRequiredTitleRule implements LegacyDoubleOptInSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyDoubleOptInSegment): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyDoubleOptInSegmentRequiredCampaignRefRule implements LegacyDoubleOptInSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyDoubleOptInSegment): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a legacy double opt in segment. */
export class LegacyDoubleOptInSegmentValidator {
  rules: LegacyDoubleOptInSegmentRule[];

  constructor(rules: LegacyDoubleOptInSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyDoubleOptInSegment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacyDoubleOptInSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyDoubleOptInSegment[]): Map<string, string[]> {
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

export function defaultLegacyDoubleOptInSegmentValidator(): LegacyDoubleOptInSegmentValidator {
  return new LegacyDoubleOptInSegmentValidator(
    [
      new LegacyDoubleOptInSegmentDurationMinutesRangeRule(64, 86400),
      new LegacyDoubleOptInSegmentCampaignRefLengthRule(1000),
      new LegacyDoubleOptInSegmentRequiredTitleRule("legacy double opt in segment needs this field"),
      new LegacyDoubleOptInSegmentRequiredCampaignRefRule("legacy double opt in segment needs an entry"),
    ],
  );
}
