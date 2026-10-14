import { RollingTouchpointSegment } from "./rolling-touchpoint-segment.js";

/** A rule a rolling touchpoint segment must pass. Check returns its problems, or none. */
export interface RollingTouchpointSegmentRule {
  check(item: RollingTouchpointSegment): string[];
}

export class RollingTouchpointSegmentBidRangeRule implements RollingTouchpointSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingTouchpointSegment): string[] {
    const value = item.bid;
    if (value < this.min || value > this.max) return [`bid ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RollingTouchpointSegmentRequiredTimezoneRule implements RollingTouchpointSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingTouchpointSegment): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class RollingTouchpointSegmentRateRangeRule implements RollingTouchpointSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingTouchpointSegment): string[] {
    const value = item.rate;
    if (value < this.min || value > this.max) return [`rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RollingTouchpointSegmentCodePrefixRule implements RollingTouchpointSegmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RollingTouchpointSegment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RollingTouchpointSegmentUpdatedAtRangeRule implements RollingTouchpointSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingTouchpointSegment): string[] {
    const value = item.updatedAt;
    if (value < this.min || value > this.max) return [`updated at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RollingTouchpointSegmentThresholdRangeRule implements RollingTouchpointSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingTouchpointSegment): string[] {
    const value = item.threshold;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`threshold ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`threshold ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a rolling touchpoint segment. */
export class RollingTouchpointSegmentValidator {
  rules: RollingTouchpointSegmentRule[];

  constructor(rules: RollingTouchpointSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: RollingTouchpointSegment): string[] {
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

  requireValid(item: RollingTouchpointSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingTouchpointSegment[]): Map<string, string[]> {
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

export function defaultRollingTouchpointSegmentValidator(): RollingTouchpointSegmentValidator {
  return new RollingTouchpointSegmentValidator(
    [
      new RollingTouchpointSegmentBidRangeRule(3.4, 1125.7),
      new RollingTouchpointSegmentRequiredTimezoneRule("rolling touchpoint segment needs an entry"),
      new RollingTouchpointSegmentRateRangeRule(6, 1924.4),
      new RollingTouchpointSegmentCodePrefixRule("OPS"),
      new RollingTouchpointSegmentUpdatedAtRangeRule(80, 255),
      new RollingTouchpointSegmentThresholdRangeRule(7.9, 2889.6),
    ],
  );
}
