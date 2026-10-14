import * as text from "../../../../kit/text.js";
import { AdaptiveLevelForecast } from "./adaptive-level-forecast.js";

/** A rule a adaptive level forecast must pass. Check returns its problems, or none. */
export interface AdaptiveLevelForecastRule {
  check(item: AdaptiveLevelForecast): string[];
}

export class AdaptiveLevelForecastCodePrefixRule implements AdaptiveLevelForecastRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: AdaptiveLevelForecast): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class AdaptiveLevelForecastCodeLengthRule implements AdaptiveLevelForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveLevelForecast): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveLevelForecastArchivedGuardRule implements AdaptiveLevelForecastRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: AdaptiveLevelForecast): string[] {
    if (item.archived && item.version > this.limit) return [`version ${item.version} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class AdaptiveLevelForecastAllowedRegionRule implements AdaptiveLevelForecastRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: AdaptiveLevelForecast): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.region))) return [`region ${item.region} is out of range`];
    return [];
  }
}

export class AdaptiveLevelForecastLimitRangeRule implements AdaptiveLevelForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveLevelForecast): string[] {
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

/** Runs every rule of a adaptive level forecast. */
export class AdaptiveLevelForecastValidator {
  rules: AdaptiveLevelForecastRule[];

  constructor(rules: AdaptiveLevelForecastRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveLevelForecast): string[] {
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

  requireValid(item: AdaptiveLevelForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveLevelForecast[]): Map<string, string[]> {
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

export function defaultAdaptiveLevelForecastValidator(): AdaptiveLevelForecastValidator {
  return new AdaptiveLevelForecastValidator(
    [
      new AdaptiveLevelForecastCodePrefixRule("X"),
      new AdaptiveLevelForecastCodeLengthRule(32),
      new AdaptiveLevelForecastArchivedGuardRule(3600),
      new AdaptiveLevelForecastAllowedRegionRule(["weighted", "rolling"]),
      new AdaptiveLevelForecastLimitRangeRule(120, 120),
    ],
  );
}
