import * as text from "../../../../kit/text.js";
import { StrictPacingBundle } from "./strict-pacing-bundle.js";

/** A rule a strict pacing bundle must pass. Check returns its problems, or none. */
export interface StrictPacingBundleRule {
  check(item: StrictPacingBundle): string[];
}

export class StrictPacingBundleUpdatedAtRangeRule implements StrictPacingBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictPacingBundle): string[] {
    const value = item.updatedAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`updated at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`updated at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StrictPacingBundleSegmentLengthRule implements StrictPacingBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictPacingBundle): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictPacingBundleAllowedSegmentRule implements StrictPacingBundleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StrictPacingBundle): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.segment))) return [`segment ${item.segment} is not allowed`];
    return [];
  }
}

export class StrictPacingBundleMinimumRangeRule implements StrictPacingBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictPacingBundle): string[] {
    const value = item.minimum;
    if (value < this.min || value > this.max) return [`minimum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StrictPacingBundleRequiredRegionRule implements StrictPacingBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictPacingBundle): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a strict pacing bundle. */
export class StrictPacingBundleValidator {
  rules: StrictPacingBundleRule[];

  constructor(rules: StrictPacingBundleRule[]) {
    this.rules = rules;
  }

  validate(item: StrictPacingBundle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StrictPacingBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictPacingBundle[]): Map<string, string[]> {
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

export function defaultStrictPacingBundleValidator(): StrictPacingBundleValidator {
  return new StrictPacingBundleValidator(
    [
      new StrictPacingBundleUpdatedAtRangeRule(16, 80),
      new StrictPacingBundleSegmentLengthRule(3600),
      new StrictPacingBundleAllowedSegmentRule([]),
      new StrictPacingBundleMinimumRangeRule(7.3, 1568.7),
      new StrictPacingBundleRequiredRegionRule("strict pacing bundle needs this field"),
    ],
  );
}
