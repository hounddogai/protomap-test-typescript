import { ScheduledTouchpointSegment } from "./scheduled-touchpoint-segment.js";

/** A rule a scheduled touchpoint segment must pass. Check returns its problems, or none. */
export interface ScheduledTouchpointSegmentRule {
  check(item: ScheduledTouchpointSegment): string[];
}

export class ScheduledTouchpointSegmentCostRangeRule implements ScheduledTouchpointSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledTouchpointSegment): string[] {
    const value = item.cost;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`cost ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`cost ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ScheduledTouchpointSegmentRequiredTimezoneRule implements ScheduledTouchpointSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledTouchpointSegment): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledTouchpointSegmentEndsAtRangeRule implements ScheduledTouchpointSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledTouchpointSegment): string[] {
    const value = item.endsAt;
    if (value < this.min || value > this.max) return [`ends at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ScheduledTouchpointSegmentClicksRangeRule implements ScheduledTouchpointSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledTouchpointSegment): string[] {
    const value = item.clicks;
    if (value < this.min || value > this.max) return [`clicks ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ScheduledTouchpointSegmentRegionLengthRule implements ScheduledTouchpointSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledTouchpointSegment): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a scheduled touchpoint segment. */
export class ScheduledTouchpointSegmentValidator {
  rules: ScheduledTouchpointSegmentRule[];

  constructor(rules: ScheduledTouchpointSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledTouchpointSegment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ScheduledTouchpointSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledTouchpointSegment[]): Map<string, string[]> {
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

export function defaultScheduledTouchpointSegmentValidator(): ScheduledTouchpointSegmentValidator {
  return new ScheduledTouchpointSegmentValidator(
    [
      new ScheduledTouchpointSegmentCostRangeRule(7.4, 4766.4),
      new ScheduledTouchpointSegmentRequiredTimezoneRule("scheduled touchpoint segment needs an entry"),
      new ScheduledTouchpointSegmentEndsAtRangeRule(80, 255),
      new ScheduledTouchpointSegmentClicksRangeRule(120, 1000),
      new ScheduledTouchpointSegmentRegionLengthRule(32),
    ],
  );
}
