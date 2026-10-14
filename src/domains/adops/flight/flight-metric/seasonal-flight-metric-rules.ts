import { SeasonalFlightMetric } from "./seasonal-flight-metric.js";

/** A rule a seasonal flight metric must pass. Check returns its problems, or none. */
export interface SeasonalFlightMetricRule {
  check(item: SeasonalFlightMetric): string[];
}

export class SeasonalFlightMetricRequiredCodeRule implements SeasonalFlightMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalFlightMetric): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalFlightMetricCodeLengthRule implements SeasonalFlightMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalFlightMetric): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalFlightMetricRequiredVariantRule implements SeasonalFlightMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalFlightMetric): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalFlightMetricUpdatedAtRangeRule implements SeasonalFlightMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalFlightMetric): string[] {
    const value = item.updatedAt;
    if (value < this.min || value > this.max) return [`updated at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SeasonalFlightMetricCodePrefixRule implements SeasonalFlightMetricRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SeasonalFlightMetric): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a seasonal flight metric. */
export class SeasonalFlightMetricValidator {
  rules: SeasonalFlightMetricRule[];

  constructor(rules: SeasonalFlightMetricRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalFlightMetric): string[] {
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

  requireValid(item: SeasonalFlightMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalFlightMetric[]): Map<string, string[]> {
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

export function defaultSeasonalFlightMetricValidator(): SeasonalFlightMetricValidator {
  return new SeasonalFlightMetricValidator(
    [
      new SeasonalFlightMetricRequiredCodeRule("seasonal flight metric needs an entry"),
      new SeasonalFlightMetricCodeLengthRule(1000),
      new SeasonalFlightMetricRequiredVariantRule("seasonal flight metric needs an entry"),
      new SeasonalFlightMetricUpdatedAtRangeRule(64, 120),
      new SeasonalFlightMetricCodePrefixRule("REF"),
    ],
  );
}
