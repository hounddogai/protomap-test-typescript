import * as text from "../../../../kit/text.js";
import { WeightedPacingThreshold } from "./weighted-pacing-threshold.js";

/** A rule a weighted pacing threshold must pass. Check returns its problems, or none. */
export interface WeightedPacingThresholdRule {
  check(item: WeightedPacingThreshold): string[];
}

export class WeightedPacingThresholdAllowedSegmentRule implements WeightedPacingThresholdRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WeightedPacingThreshold): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.segment))) return [`segment ${item.segment} is unknown`];
    return [];
  }
}

export class WeightedPacingThresholdTitleLengthRule implements WeightedPacingThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedPacingThreshold): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedPacingThresholdSegmentLengthRule implements WeightedPacingThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedPacingThreshold): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a weighted pacing threshold. */
export class WeightedPacingThresholdValidator {
  rules: WeightedPacingThresholdRule[];

  constructor(rules: WeightedPacingThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedPacingThreshold): string[] {
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

  requireValid(item: WeightedPacingThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedPacingThreshold[]): Map<string, string[]> {
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

export function defaultWeightedPacingThresholdValidator(): WeightedPacingThresholdValidator {
  return new WeightedPacingThresholdValidator(
    [
      new WeightedPacingThresholdAllowedSegmentRule(["regional", "seasonal", "fallback"]),
      new WeightedPacingThresholdTitleLengthRule(3600),
      new WeightedPacingThresholdSegmentLengthRule(64),
    ],
  );
}
