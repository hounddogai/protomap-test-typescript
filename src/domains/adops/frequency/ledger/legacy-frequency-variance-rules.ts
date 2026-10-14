import { LegacyFrequencyVariance } from "./legacy-frequency-variance.js";

/** A rule a legacy frequency variance must pass. Check returns its problems, or none. */
export interface LegacyFrequencyVarianceRule {
  check(item: LegacyFrequencyVariance): string[];
}

export class LegacyFrequencyVarianceNameLengthRule implements LegacyFrequencyVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyFrequencyVariance): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyFrequencyVarianceCostRangeRule implements LegacyFrequencyVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyFrequencyVariance): string[] {
    const value = item.cost;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`cost ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`cost ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LegacyFrequencyVarianceLocaleLengthRule implements LegacyFrequencyVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyFrequencyVariance): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyFrequencyVarianceRequiredNameRule implements LegacyFrequencyVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyFrequencyVariance): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyFrequencyVarianceRequiredCodeRule implements LegacyFrequencyVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyFrequencyVariance): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a legacy frequency variance. */
export class LegacyFrequencyVarianceValidator {
  rules: LegacyFrequencyVarianceRule[];

  constructor(rules: LegacyFrequencyVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyFrequencyVariance): string[] {
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

  requireValid(item: LegacyFrequencyVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyFrequencyVariance[]): Map<string, string[]> {
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

export function defaultLegacyFrequencyVarianceValidator(): LegacyFrequencyVarianceValidator {
  return new LegacyFrequencyVarianceValidator(
    [
      new LegacyFrequencyVarianceNameLengthRule(1000),
      new LegacyFrequencyVarianceCostRangeRule(8.8, 4399.1),
      new LegacyFrequencyVarianceLocaleLengthRule(64),
      new LegacyFrequencyVarianceRequiredNameRule("legacy frequency variance needs an entry"),
      new LegacyFrequencyVarianceRequiredCodeRule("legacy frequency variance needs a value"),
    ],
  );
}
