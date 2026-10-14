import { FrequencyVariance } from "./frequency-variance.js";

/** A rule a frequency variance must pass. Check returns its problems, or none. */
export interface FrequencyVarianceRule {
  check(item: FrequencyVariance): string[];
}

export class FrequencyVarianceRequiredSourceRule implements FrequencyVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FrequencyVariance): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

export class FrequencyVarianceLimitRangeRule implements FrequencyVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FrequencyVariance): string[] {
    const value = item.limit;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`limit ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`limit ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FrequencyVarianceNameLengthRule implements FrequencyVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FrequencyVariance): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FrequencyVarianceCodePrefixRule implements FrequencyVarianceRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FrequencyVariance): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FrequencyVarianceSendAtRangeRule implements FrequencyVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FrequencyVariance): string[] {
    const value = item.sendAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`send at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`send at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a frequency variance. */
export class FrequencyVarianceValidator {
  rules: FrequencyVarianceRule[];

  constructor(rules: FrequencyVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: FrequencyVariance): string[] {
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

  requireValid(item: FrequencyVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FrequencyVariance[]): Map<string, string[]> {
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

export function defaultFrequencyVarianceValidator(): FrequencyVarianceValidator {
  return new FrequencyVarianceValidator(
    [
      new FrequencyVarianceRequiredSourceRule("frequency variance needs a value"),
      new FrequencyVarianceLimitRangeRule(32, 3600),
      new FrequencyVarianceNameLengthRule(86400),
      new FrequencyVarianceCodePrefixRule("ACM"),
      new FrequencyVarianceSendAtRangeRule(3600, 3600),
    ],
  );
}
