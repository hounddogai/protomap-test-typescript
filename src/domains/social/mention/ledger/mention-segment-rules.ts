import { MentionSegment } from "./mention-segment.js";

/** A rule a mention segment must pass. Check returns its problems, or none. */
export interface MentionSegmentRule {
  check(item: MentionSegment): string[];
}

export class MentionSegmentScoreRangeRule implements MentionSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: MentionSegment): string[] {
    const value = item.score;
    if (value < this.min || value > this.max) return [`score ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class MentionSegmentVersionRangeRule implements MentionSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: MentionSegment): string[] {
    const value = item.version;
    if (value < this.min || value > this.max) return [`version ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class MentionSegmentRequiredCodeRule implements MentionSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: MentionSegment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a mention segment. */
export class MentionSegmentValidator {
  rules: MentionSegmentRule[];

  constructor(rules: MentionSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: MentionSegment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: MentionSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: MentionSegment[]): Map<string, string[]> {
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

export function defaultMentionSegmentValidator(): MentionSegmentValidator {
  return new MentionSegmentValidator(
    [
      new MentionSegmentScoreRangeRule(1.2, 3060.3),
      new MentionSegmentVersionRangeRule(1000, 86400),
      new MentionSegmentRequiredCodeRule("mention segment needs this field"),
    ],
  );
}
