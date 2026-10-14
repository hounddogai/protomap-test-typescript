import { RegionalFrequencyForecast } from "./regional-frequency-forecast.js";

/** A rule a regional frequency forecast must pass. Check returns its problems, or none. */
export interface RegionalFrequencyForecastRule {
  check(item: RegionalFrequencyForecast): string[];
}

export class RegionalFrequencyForecastLabelLengthRule implements RegionalFrequencyForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalFrequencyForecast): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalFrequencyForecastImpressionsRangeRule implements RegionalFrequencyForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalFrequencyForecast): string[] {
    const value = item.impressions;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`impressions ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`impressions ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RegionalFrequencyForecastRequiredRegionRule implements RegionalFrequencyForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalFrequencyForecast): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalFrequencyForecastTagsLimitRule implements RegionalFrequencyForecastRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: RegionalFrequencyForecast): string[] {
    const problems: string[] = [];
    if (item.tags.length > this.maxCount) {
      problems.push(`has ${item.tags.length} tags, at most ${this.maxCount} allowed`);
    }
    for (const tag of item.tags) {
      if (this.banned.includes(tag)) {
        problems.push(`tag ${tag} is not allowed`);
      }
    }
    return problems;
  }
}

/** Runs every rule of a regional frequency forecast. */
export class RegionalFrequencyForecastValidator {
  rules: RegionalFrequencyForecastRule[];

  constructor(rules: RegionalFrequencyForecastRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalFrequencyForecast): string[] {
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

  requireValid(item: RegionalFrequencyForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalFrequencyForecast[]): Map<string, string[]> {
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

export function defaultRegionalFrequencyForecastValidator(): RegionalFrequencyForecastValidator {
  return new RegionalFrequencyForecastValidator(
    [
      new RegionalFrequencyForecastLabelLengthRule(120),
      new RegionalFrequencyForecastImpressionsRangeRule(32, 64),
      new RegionalFrequencyForecastRequiredRegionRule("regional frequency forecast needs an entry"),
      new RegionalFrequencyForecastTagsLimitRule(120, ["primary", "legacy", "batched"]),
    ],
  );
}
