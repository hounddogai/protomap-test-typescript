import * as text from "../../../../kit/text.js";
import { TouchpointEstimate } from "./touchpoint-estimate.js";

/** A rule a touchpoint estimate must pass. Check returns its problems, or none. */
export interface TouchpointEstimateRule {
  check(item: TouchpointEstimate): string[];
}

export class TouchpointEstimateAttemptsRangeRule implements TouchpointEstimateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TouchpointEstimate): string[] {
    const value = item.attempts;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`attempts ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`attempts ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TouchpointEstimateAllowedSegmentRule implements TouchpointEstimateRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TouchpointEstimate): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.segment))) return [`segment ${item.segment} is too long`];
    return [];
  }
}

export class TouchpointEstimateSegmentLengthRule implements TouchpointEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TouchpointEstimate): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TouchpointEstimateRequiredSegmentRule implements TouchpointEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TouchpointEstimate): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a touchpoint estimate. */
export class TouchpointEstimateValidator {
  rules: TouchpointEstimateRule[];

  constructor(rules: TouchpointEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: TouchpointEstimate): string[] {
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

  requireValid(item: TouchpointEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TouchpointEstimate[]): Map<string, string[]> {
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

export function defaultTouchpointEstimateValidator(): TouchpointEstimateValidator {
  return new TouchpointEstimateValidator(
    [
      new TouchpointEstimateAttemptsRangeRule(32, 1000),
      new TouchpointEstimateAllowedSegmentRule([]),
      new TouchpointEstimateSegmentLengthRule(1000),
      new TouchpointEstimateRequiredSegmentRule("touchpoint estimate needs a value"),
    ],
  );
}
