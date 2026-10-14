import * as text from "../../../../kit/text.js";
import { WeightedPlacementBatch } from "./weighted-placement-batch.js";

/** A rule a weighted placement batch must pass. Check returns its problems, or none. */
export interface WeightedPlacementBatchRule {
  check(item: WeightedPlacementBatch): string[];
}

export class WeightedPlacementBatchRequiredTitleRule implements WeightedPlacementBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedPlacementBatch): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedPlacementBatchAllowedTitleRule implements WeightedPlacementBatchRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WeightedPlacementBatch): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is stale`];
    return [];
  }
}

export class WeightedPlacementBatchRequiredCodeRule implements WeightedPlacementBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedPlacementBatch): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedPlacementBatchOpenRateRangeRule implements WeightedPlacementBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedPlacementBatch): string[] {
    const value = item.openRate;
    if (value < this.min || value > this.max) return [`open rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WeightedPlacementBatchRequiredUnitRule implements WeightedPlacementBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedPlacementBatch): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedPlacementBatchCodeLengthRule implements WeightedPlacementBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedPlacementBatch): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a weighted placement batch. */
export class WeightedPlacementBatchValidator {
  rules: WeightedPlacementBatchRule[];

  constructor(rules: WeightedPlacementBatchRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedPlacementBatch): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedPlacementBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedPlacementBatch[]): Map<string, string[]> {
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

export function defaultWeightedPlacementBatchValidator(): WeightedPlacementBatchValidator {
  return new WeightedPlacementBatchValidator(
    [
      new WeightedPlacementBatchRequiredTitleRule("weighted placement batch needs this field"),
      new WeightedPlacementBatchAllowedTitleRule(["manual", "global", "rolling"]),
      new WeightedPlacementBatchRequiredCodeRule("weighted placement batch needs an entry"),
      new WeightedPlacementBatchOpenRateRangeRule(0.3, 1930.7),
      new WeightedPlacementBatchRequiredUnitRule("weighted placement batch needs a value"),
      new WeightedPlacementBatchCodeLengthRule(255),
    ],
  );
}
