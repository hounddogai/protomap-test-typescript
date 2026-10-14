import * as text from "../../../../kit/text.js";
import { SeasonalPathBatch } from "./seasonal-path-batch.js";

/** A rule a seasonal path batch must pass. Check returns its problems, or none. */
export interface SeasonalPathBatchRule {
  check(item: SeasonalPathBatch): string[];
}

export class SeasonalPathBatchVariantLengthRule implements SeasonalPathBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalPathBatch): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalPathBatchRequiredVariantRule implements SeasonalPathBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalPathBatch): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalPathBatchAllowedLabelRule implements SeasonalPathBatchRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SeasonalPathBatch): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is missing`];
    return [];
  }
}

export class SeasonalPathBatchRateRangeRule implements SeasonalPathBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalPathBatch): string[] {
    const value = item.rate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SeasonalPathBatchWeightRangeRule implements SeasonalPathBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalPathBatch): string[] {
    const value = item.weight;
    if (value < this.min || value > this.max) return [`weight ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SeasonalPathBatchLimitRangeRule implements SeasonalPathBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalPathBatch): string[] {
    const value = item.limit;
    if (value < this.min || value > this.max) return [`limit ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a seasonal path batch. */
export class SeasonalPathBatchValidator {
  rules: SeasonalPathBatchRule[];

  constructor(rules: SeasonalPathBatchRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalPathBatch): string[] {
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

  requireValid(item: SeasonalPathBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalPathBatch[]): Map<string, string[]> {
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

export function defaultSeasonalPathBatchValidator(): SeasonalPathBatchValidator {
  return new SeasonalPathBatchValidator(
    [
      new SeasonalPathBatchVariantLengthRule(80),
      new SeasonalPathBatchRequiredVariantRule("seasonal path batch needs a value"),
      new SeasonalPathBatchAllowedLabelRule([]),
      new SeasonalPathBatchRateRangeRule(2.2, 922.7),
      new SeasonalPathBatchWeightRangeRule(8.4, 4024.2),
      new SeasonalPathBatchLimitRangeRule(120, 255),
    ],
  );
}
