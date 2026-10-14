import { WeightedActivationBatch } from "./weighted-activation-batch.js";

/** A rule a weighted activation batch must pass. Check returns its problems, or none. */
export interface WeightedActivationBatchRule {
  check(item: WeightedActivationBatch): string[];
}

export class WeightedActivationBatchQuantityRangeRule implements WeightedActivationBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedActivationBatch): string[] {
    const value = item.quantity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`quantity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`quantity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WeightedActivationBatchRequiredAudienceIdRule implements WeightedActivationBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedActivationBatch): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedActivationBatchRequiredCodeRule implements WeightedActivationBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedActivationBatch): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedActivationBatchRequiredNameRule implements WeightedActivationBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedActivationBatch): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedActivationBatchWindowDaysRangeRule implements WeightedActivationBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedActivationBatch): string[] {
    const value = item.windowDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`window days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`window days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WeightedActivationBatchCodeLengthRule implements WeightedActivationBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedActivationBatch): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a weighted activation batch. */
export class WeightedActivationBatchValidator {
  rules: WeightedActivationBatchRule[];

  constructor(rules: WeightedActivationBatchRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedActivationBatch): string[] {
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

  requireValid(item: WeightedActivationBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedActivationBatch[]): Map<string, string[]> {
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

export function defaultWeightedActivationBatchValidator(): WeightedActivationBatchValidator {
  return new WeightedActivationBatchValidator(
    [
      new WeightedActivationBatchQuantityRangeRule(120, 1000),
      new WeightedActivationBatchRequiredAudienceIdRule("weighted activation batch needs this field"),
      new WeightedActivationBatchRequiredCodeRule("weighted activation batch needs a value"),
      new WeightedActivationBatchRequiredNameRule("weighted activation batch needs this field"),
      new WeightedActivationBatchWindowDaysRangeRule(32, 86400),
      new WeightedActivationBatchCodeLengthRule(86400),
    ],
  );
}
