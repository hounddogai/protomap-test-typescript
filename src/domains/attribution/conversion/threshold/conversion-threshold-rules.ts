import { ConversionThreshold } from "./conversion-threshold.js";

/** A rule a conversion threshold must pass. Check returns its problems, or none. */
export interface ConversionThresholdRule {
  check(item: ConversionThreshold): string[];
}

export class ConversionThresholdCreatedAtRangeRule implements ConversionThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ConversionThreshold): string[] {
    const value = item.createdAt;
    if (value < this.min || value > this.max) return [`created at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ConversionThresholdWeightRangeRule implements ConversionThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ConversionThreshold): string[] {
    const value = item.weight;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`weight ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`weight ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ConversionThresholdRequiredTitleRule implements ConversionThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ConversionThreshold): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a conversion threshold. */
export class ConversionThresholdValidator {
  rules: ConversionThresholdRule[];

  constructor(rules: ConversionThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: ConversionThreshold): string[] {
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

  requireValid(item: ConversionThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ConversionThreshold[]): Map<string, string[]> {
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

export function defaultConversionThresholdValidator(): ConversionThresholdValidator {
  return new ConversionThresholdValidator(
    [
      new ConversionThresholdCreatedAtRangeRule(32, 255),
      new ConversionThresholdWeightRangeRule(3.2, 1990.1),
      new ConversionThresholdRequiredTitleRule("conversion threshold needs an entry"),
    ],
  );
}
