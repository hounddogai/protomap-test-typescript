import { ChallengeForecast } from "./challenge-forecast.js";

/** A rule a challenge forecast must pass. Check returns its problems, or none. */
export interface ChallengeForecastRule {
  check(item: ChallengeForecast): string[];
}

export class ChallengeForecastVersionRangeRule implements ChallengeForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ChallengeForecast): string[] {
    const value = item.version;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`version ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`version ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ChallengeForecastArchivedGuardRule implements ChallengeForecastRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: ChallengeForecast): string[] {
    if (item.archived && item.version > this.limit) return [`version ${item.version} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class ChallengeForecastRequiredNameRule implements ChallengeForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ChallengeForecast): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class ChallengeForecastCodePrefixRule implements ChallengeForecastRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ChallengeForecast): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ChallengeForecastRequiredTimezoneRule implements ChallengeForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ChallengeForecast): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a challenge forecast. */
export class ChallengeForecastValidator {
  rules: ChallengeForecastRule[];

  constructor(rules: ChallengeForecastRule[]) {
    this.rules = rules;
  }

  validate(item: ChallengeForecast): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ChallengeForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ChallengeForecast[]): Map<string, string[]> {
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

export function defaultChallengeForecastValidator(): ChallengeForecastValidator {
  return new ChallengeForecastValidator(
    [
      new ChallengeForecastVersionRangeRule(32, 64),
      new ChallengeForecastArchivedGuardRule(1000),
      new ChallengeForecastRequiredNameRule("challenge forecast needs a value"),
      new ChallengeForecastCodePrefixRule("OPS"),
      new ChallengeForecastRequiredTimezoneRule("challenge forecast needs this field"),
    ],
  );
}
