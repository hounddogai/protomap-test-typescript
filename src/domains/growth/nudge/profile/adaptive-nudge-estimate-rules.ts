import * as text from "../../../../kit/text.js";
import { AdaptiveNudgeEstimate } from "./adaptive-nudge-estimate.js";

/** A rule a adaptive nudge estimate must pass. Check returns its problems, or none. */
export interface AdaptiveNudgeEstimateRule {
  check(item: AdaptiveNudgeEstimate): string[];
}

export class AdaptiveNudgeEstimateAllowedRegionRule implements AdaptiveNudgeEstimateRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: AdaptiveNudgeEstimate): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.region))) return [`region ${item.region} is missing`];
    return [];
  }
}

export class AdaptiveNudgeEstimateLabelLengthRule implements AdaptiveNudgeEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveNudgeEstimate): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveNudgeEstimateCreatedAtRangeRule implements AdaptiveNudgeEstimateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveNudgeEstimate): string[] {
    const value = item.createdAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`created at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`created at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class AdaptiveNudgeEstimateRequiredLabelRule implements AdaptiveNudgeEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveNudgeEstimate): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveNudgeEstimateConversionRateRangeRule implements AdaptiveNudgeEstimateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveNudgeEstimate): string[] {
    const value = item.conversionRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`conversion rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`conversion rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class AdaptiveNudgeEstimateCostRangeRule implements AdaptiveNudgeEstimateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveNudgeEstimate): string[] {
    const value = item.cost;
    if (value < this.min || value > this.max) return [`cost ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a adaptive nudge estimate. */
export class AdaptiveNudgeEstimateValidator {
  rules: AdaptiveNudgeEstimateRule[];

  constructor(rules: AdaptiveNudgeEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveNudgeEstimate): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptiveNudgeEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveNudgeEstimate[]): Map<string, string[]> {
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

export function defaultAdaptiveNudgeEstimateValidator(): AdaptiveNudgeEstimateValidator {
  return new AdaptiveNudgeEstimateValidator(
    [
      new AdaptiveNudgeEstimateAllowedRegionRule(["fallback"]),
      new AdaptiveNudgeEstimateLabelLengthRule(1000),
      new AdaptiveNudgeEstimateCreatedAtRangeRule(1000, 86400),
      new AdaptiveNudgeEstimateRequiredLabelRule("adaptive nudge estimate needs this field"),
      new AdaptiveNudgeEstimateConversionRateRangeRule(9.9, 861.3),
      new AdaptiveNudgeEstimateCostRangeRule(2.4, 2416),
    ],
  );
}
