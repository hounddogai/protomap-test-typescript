import { RegionalPathForecast } from "./regional-path-forecast.js";

/** A rule a regional path forecast must pass. Check returns its problems, or none. */
export interface RegionalPathForecastRule {
  check(item: RegionalPathForecast): string[];
}

export class RegionalPathForecastCeilingRangeRule implements RegionalPathForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalPathForecast): string[] {
    const value = item.ceiling;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ceiling ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ceiling ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RegionalPathForecastRequiredLabelRule implements RegionalPathForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalPathForecast): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalPathForecastTagsLimitRule implements RegionalPathForecastRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: RegionalPathForecast): string[] {
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

/** Runs every rule of a regional path forecast. */
export class RegionalPathForecastValidator {
  rules: RegionalPathForecastRule[];

  constructor(rules: RegionalPathForecastRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalPathForecast): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RegionalPathForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalPathForecast[]): Map<string, string[]> {
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

export function defaultRegionalPathForecastValidator(): RegionalPathForecastValidator {
  return new RegionalPathForecastValidator(
    [
      new RegionalPathForecastCeilingRangeRule(4.9, 1060.2),
      new RegionalPathForecastRequiredLabelRule("regional path forecast needs an entry"),
      new RegionalPathForecastTagsLimitRule(3600, ["default"]),
    ],
  );
}
