import { TieredRetentionForecast } from "./tiered-retention-forecast.js";

/** A rule a tiered retention forecast must pass. Check returns its problems, or none. */
export interface TieredRetentionForecastRule {
  check(item: TieredRetentionForecast): string[];
}

export class TieredRetentionForecastRequiredRegionRule implements TieredRetentionForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredRetentionForecast): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

export class TieredRetentionForecastRegionLengthRule implements TieredRetentionForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredRetentionForecast): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredRetentionForecastRequiredTitleRule implements TieredRetentionForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredRetentionForecast): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class TieredRetentionForecastTitleLengthRule implements TieredRetentionForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredRetentionForecast): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredRetentionForecastCodePrefixRule implements TieredRetentionForecastRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TieredRetentionForecast): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a tiered retention forecast. */
export class TieredRetentionForecastValidator {
  rules: TieredRetentionForecastRule[];

  constructor(rules: TieredRetentionForecastRule[]) {
    this.rules = rules;
  }

  validate(item: TieredRetentionForecast): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredRetentionForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredRetentionForecast[]): Map<string, string[]> {
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

export function defaultTieredRetentionForecastValidator(): TieredRetentionForecastValidator {
  return new TieredRetentionForecastValidator(
    [
      new TieredRetentionForecastRequiredRegionRule("tiered retention forecast needs an entry"),
      new TieredRetentionForecastRegionLengthRule(16),
      new TieredRetentionForecastRequiredTitleRule("tiered retention forecast needs an entry"),
      new TieredRetentionForecastTitleLengthRule(120),
      new TieredRetentionForecastCodePrefixRule("Q"),
    ],
  );
}
