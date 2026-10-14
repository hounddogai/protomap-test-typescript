import { GlobalNudgeForecast } from "./global-nudge-forecast.js";

/** A rule a global nudge forecast must pass. Check returns its problems, or none. */
export interface GlobalNudgeForecastRule {
  check(item: GlobalNudgeForecast): string[];
}

export class GlobalNudgeForecastRequiredTitleRule implements GlobalNudgeForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalNudgeForecast): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalNudgeForecastArchivedGuardRule implements GlobalNudgeForecastRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: GlobalNudgeForecast): string[] {
    if (item.archived && item.score > this.limit) return [`score ${item.score} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class GlobalNudgeForecastRequiredCodeRule implements GlobalNudgeForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalNudgeForecast): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalNudgeForecastScoreRangeRule implements GlobalNudgeForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalNudgeForecast): string[] {
    const value = item.score;
    if (value < this.min || value > this.max) return [`score ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class GlobalNudgeForecastSequenceRangeRule implements GlobalNudgeForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalNudgeForecast): string[] {
    const value = item.sequence;
    if (value < this.min || value > this.max) return [`sequence ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class GlobalNudgeForecastCodePrefixRule implements GlobalNudgeForecastRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: GlobalNudgeForecast): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a global nudge forecast. */
export class GlobalNudgeForecastValidator {
  rules: GlobalNudgeForecastRule[];

  constructor(rules: GlobalNudgeForecastRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalNudgeForecast): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalNudgeForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalNudgeForecast[]): Map<string, string[]> {
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

export function defaultGlobalNudgeForecastValidator(): GlobalNudgeForecastValidator {
  return new GlobalNudgeForecastValidator(
    [
      new GlobalNudgeForecastRequiredTitleRule("global nudge forecast needs an entry"),
      new GlobalNudgeForecastArchivedGuardRule(5.3),
      new GlobalNudgeForecastRequiredCodeRule("global nudge forecast needs this field"),
      new GlobalNudgeForecastScoreRangeRule(2.3, 1942),
      new GlobalNudgeForecastSequenceRangeRule(16, 255),
      new GlobalNudgeForecastCodePrefixRule("REF"),
    ],
  );
}
