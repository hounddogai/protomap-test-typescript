import { ReputationSegment } from "./reputation-segment.js";

/** A rule a reputation segment must pass. Check returns its problems, or none. */
export interface ReputationSegmentRule {
  check(item: ReputationSegment): string[];
}

export class ReputationSegmentRequiredCodeRule implements ReputationSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReputationSegment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ReputationSegmentEndsAtRangeRule implements ReputationSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ReputationSegment): string[] {
    const value = item.endsAt;
    if (value < this.min || value > this.max) return [`ends at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ReputationSegmentRequiredChannelRule implements ReputationSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReputationSegment): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a reputation segment. */
export class ReputationSegmentValidator {
  rules: ReputationSegmentRule[];

  constructor(rules: ReputationSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: ReputationSegment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ReputationSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ReputationSegment[]): Map<string, string[]> {
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

export function defaultReputationSegmentValidator(): ReputationSegmentValidator {
  return new ReputationSegmentValidator(
    [
      new ReputationSegmentRequiredCodeRule("reputation segment needs this field"),
      new ReputationSegmentEndsAtRangeRule(16, 64),
      new ReputationSegmentRequiredChannelRule("reputation segment needs a value"),
    ],
  );
}
