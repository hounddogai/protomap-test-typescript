import { WeightedCsatVariance } from "./weighted-csat-variance.js";

/** A rule a weighted csat variance must pass. Check returns its problems, or none. */
export interface WeightedCsatVarianceRule {
  check(item: WeightedCsatVariance): string[];
}

export class WeightedCsatVarianceStartsAtRangeRule implements WeightedCsatVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedCsatVariance): string[] {
    const value = item.startsAt;
    if (value < this.min || value > this.max) return [`starts at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WeightedCsatVarianceCodePrefixRule implements WeightedCsatVarianceRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WeightedCsatVariance): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WeightedCsatVarianceRequiredAudienceIdRule implements WeightedCsatVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedCsatVariance): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedCsatVarianceNameLengthRule implements WeightedCsatVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedCsatVariance): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedCsatVarianceBatchSizeRangeRule implements WeightedCsatVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedCsatVariance): string[] {
    const value = item.batchSize;
    if (value < this.min || value > this.max) return [`batch size ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WeightedCsatVarianceCodeLengthRule implements WeightedCsatVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedCsatVariance): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a weighted csat variance. */
export class WeightedCsatVarianceValidator {
  rules: WeightedCsatVarianceRule[];

  constructor(rules: WeightedCsatVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedCsatVariance): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedCsatVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedCsatVariance[]): Map<string, string[]> {
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

export function defaultWeightedCsatVarianceValidator(): WeightedCsatVarianceValidator {
  return new WeightedCsatVarianceValidator(
    [
      new WeightedCsatVarianceStartsAtRangeRule(1000, 3600),
      new WeightedCsatVarianceCodePrefixRule("OPS"),
      new WeightedCsatVarianceRequiredAudienceIdRule("weighted csat variance needs an entry"),
      new WeightedCsatVarianceNameLengthRule(80),
      new WeightedCsatVarianceBatchSizeRangeRule(64, 80),
      new WeightedCsatVarianceCodeLengthRule(120),
    ],
  );
}
