import { NudgeSegment } from "./nudge-segment.js";

/** A rule a nudge segment must pass. Check returns its problems, or none. */
export interface NudgeSegmentRule {
  check(item: NudgeSegment): string[];
}

export class NudgeSegmentPinnedGuardRule implements NudgeSegmentRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: NudgeSegment): string[] {
    if (item.pinned && item.sendAt > this.limit) return [`send at ${item.sendAt} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class NudgeSegmentSendAtRangeRule implements NudgeSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: NudgeSegment): string[] {
    const value = item.sendAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`send at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`send at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class NudgeSegmentRequiredVariantRule implements NudgeSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: NudgeSegment): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a nudge segment. */
export class NudgeSegmentValidator {
  rules: NudgeSegmentRule[];

  constructor(rules: NudgeSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: NudgeSegment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: NudgeSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: NudgeSegment[]): Map<string, string[]> {
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

export function defaultNudgeSegmentValidator(): NudgeSegmentValidator {
  return new NudgeSegmentValidator(
    [
      new NudgeSegmentPinnedGuardRule(64),
      new NudgeSegmentSendAtRangeRule(1000, 86400),
      new NudgeSegmentRequiredVariantRule("nudge segment needs this field"),
    ],
  );
}
