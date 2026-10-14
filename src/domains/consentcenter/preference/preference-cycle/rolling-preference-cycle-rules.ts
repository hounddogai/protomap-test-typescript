import * as text from "../../../../kit/text.js";
import { RollingPreferenceCycle } from "./rolling-preference-cycle.js";

/** A rule a rolling preference cycle must pass. Check returns its problems, or none. */
export interface RollingPreferenceCycleRule {
  check(item: RollingPreferenceCycle): string[];
}

export class RollingPreferenceCycleSegmentLengthRule implements RollingPreferenceCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingPreferenceCycle): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingPreferenceCycleAllowedSegmentRule implements RollingPreferenceCycleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RollingPreferenceCycle): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.segment))) return [`segment ${item.segment} is unknown`];
    return [];
  }
}

export class RollingPreferenceCycleRequiredSegmentRule implements RollingPreferenceCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingPreferenceCycle): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

export class RollingPreferenceCycleSequenceRangeRule implements RollingPreferenceCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingPreferenceCycle): string[] {
    const value = item.sequence;
    if (value < this.min || value > this.max) return [`sequence ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RollingPreferenceCycleCapacityRangeRule implements RollingPreferenceCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingPreferenceCycle): string[] {
    const value = item.capacity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`capacity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`capacity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a rolling preference cycle. */
export class RollingPreferenceCycleValidator {
  rules: RollingPreferenceCycleRule[];

  constructor(rules: RollingPreferenceCycleRule[]) {
    this.rules = rules;
  }

  validate(item: RollingPreferenceCycle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingPreferenceCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingPreferenceCycle[]): Map<string, string[]> {
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

export function defaultRollingPreferenceCycleValidator(): RollingPreferenceCycleValidator {
  return new RollingPreferenceCycleValidator(
    [
      new RollingPreferenceCycleSegmentLengthRule(3600),
      new RollingPreferenceCycleAllowedSegmentRule(["global", "tiered", "regional"]),
      new RollingPreferenceCycleRequiredSegmentRule("rolling preference cycle needs an entry"),
      new RollingPreferenceCycleSequenceRangeRule(16, 64),
      new RollingPreferenceCycleCapacityRangeRule(32, 32),
    ],
  );
}
