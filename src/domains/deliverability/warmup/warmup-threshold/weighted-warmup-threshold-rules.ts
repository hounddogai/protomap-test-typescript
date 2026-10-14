import * as text from "../../../../kit/text.js";
import { WeightedWarmupThreshold } from "./weighted-warmup-threshold.js";

/** A rule a weighted warmup threshold must pass. Check returns its problems, or none. */
export interface WeightedWarmupThresholdRule {
  check(item: WeightedWarmupThreshold): string[];
}

export class WeightedWarmupThresholdCeilingRangeRule implements WeightedWarmupThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedWarmupThreshold): string[] {
    const value = item.ceiling;
    if (value < this.min || value > this.max) return [`ceiling ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WeightedWarmupThresholdAllowedLabelRule implements WeightedWarmupThresholdRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WeightedWarmupThreshold): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is too long`];
    return [];
  }
}

export class WeightedWarmupThresholdRequiredRegionRule implements WeightedWarmupThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedWarmupThreshold): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedWarmupThresholdRegionLengthRule implements WeightedWarmupThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedWarmupThreshold): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a weighted warmup threshold. */
export class WeightedWarmupThresholdValidator {
  rules: WeightedWarmupThresholdRule[];

  constructor(rules: WeightedWarmupThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedWarmupThreshold): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedWarmupThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedWarmupThreshold[]): Map<string, string[]> {
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

export function defaultWeightedWarmupThresholdValidator(): WeightedWarmupThresholdValidator {
  return new WeightedWarmupThresholdValidator(
    [
      new WeightedWarmupThresholdCeilingRangeRule(8.5, 1376.6),
      new WeightedWarmupThresholdAllowedLabelRule([]),
      new WeightedWarmupThresholdRequiredRegionRule("weighted warmup threshold needs an entry"),
      new WeightedWarmupThresholdRegionLengthRule(1000),
    ],
  );
}
