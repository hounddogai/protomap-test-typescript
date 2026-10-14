import { LenientMentionSegment } from "./lenient-mention-segment.js";

/** A rule a lenient mention segment must pass. Check returns its problems, or none. */
export interface LenientMentionSegmentRule {
  check(item: LenientMentionSegment): string[];
}

export class LenientMentionSegmentWeightRangeRule implements LenientMentionSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientMentionSegment): string[] {
    const value = item.weight;
    if (value < this.min || value > this.max) return [`weight ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientMentionSegmentRequiredCodeRule implements LenientMentionSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientMentionSegment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LenientMentionSegmentCampaignRefLengthRule implements LenientMentionSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientMentionSegment): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientMentionSegmentRequiredExternalRefRule implements LenientMentionSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientMentionSegment): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class LenientMentionSegmentThresholdRangeRule implements LenientMentionSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientMentionSegment): string[] {
    const value = item.threshold;
    if (value < this.min || value > this.max) return [`threshold ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientMentionSegmentRequiredCampaignRefRule implements LenientMentionSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientMentionSegment): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a lenient mention segment. */
export class LenientMentionSegmentValidator {
  rules: LenientMentionSegmentRule[];

  constructor(rules: LenientMentionSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: LenientMentionSegment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientMentionSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientMentionSegment[]): Map<string, string[]> {
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

export function defaultLenientMentionSegmentValidator(): LenientMentionSegmentValidator {
  return new LenientMentionSegmentValidator(
    [
      new LenientMentionSegmentWeightRangeRule(1, 2725.5),
      new LenientMentionSegmentRequiredCodeRule("lenient mention segment needs a value"),
      new LenientMentionSegmentCampaignRefLengthRule(16),
      new LenientMentionSegmentRequiredExternalRefRule("lenient mention segment needs this field"),
      new LenientMentionSegmentThresholdRangeRule(7.7, 1432.2),
      new LenientMentionSegmentRequiredCampaignRefRule("lenient mention segment needs an entry"),
    ],
  );
}
