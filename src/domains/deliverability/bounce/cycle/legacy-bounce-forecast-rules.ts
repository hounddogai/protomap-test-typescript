import { LegacyBounceForecast } from "./legacy-bounce-forecast.js";

/** A rule a legacy bounce forecast must pass. Check returns its problems, or none. */
export interface LegacyBounceForecastRule {
  check(item: LegacyBounceForecast): string[];
}

export class LegacyBounceForecastDescriptionLengthRule implements LegacyBounceForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyBounceForecast): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyBounceForecastRateRangeRule implements LegacyBounceForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyBounceForecast): string[] {
    const value = item.rate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LegacyBounceForecastRequiredCodeRule implements LegacyBounceForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyBounceForecast): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyBounceForecastNameLengthRule implements LegacyBounceForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyBounceForecast): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyBounceForecastActiveGuardRule implements LegacyBounceForecastRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: LegacyBounceForecast): string[] {
    if (item.active && item.priority > this.limit) return [`priority ${item.priority} exceeds ${this.limit} while active`];
    return [];
  }
}

export class LegacyBounceForecastCeilingRangeRule implements LegacyBounceForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyBounceForecast): string[] {
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

/** Runs every rule of a legacy bounce forecast. */
export class LegacyBounceForecastValidator {
  rules: LegacyBounceForecastRule[];

  constructor(rules: LegacyBounceForecastRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyBounceForecast): string[] {
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

  requireValid(item: LegacyBounceForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyBounceForecast[]): Map<string, string[]> {
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

export function defaultLegacyBounceForecastValidator(): LegacyBounceForecastValidator {
  return new LegacyBounceForecastValidator(
    [
      new LegacyBounceForecastDescriptionLengthRule(120),
      new LegacyBounceForecastRateRangeRule(5.6, 2048.4),
      new LegacyBounceForecastRequiredCodeRule("legacy bounce forecast needs this field"),
      new LegacyBounceForecastNameLengthRule(32),
      new LegacyBounceForecastActiveGuardRule(32),
      new LegacyBounceForecastCeilingRangeRule(7.1, 4947.2),
    ],
  );
}
