import { ScheduledTouchpointForecast } from "./scheduled-touchpoint-forecast.js";

/** A rule a scheduled touchpoint forecast must pass. Check returns its problems, or none. */
export interface ScheduledTouchpointForecastRule {
  check(item: ScheduledTouchpointForecast): string[];
}

export class ScheduledTouchpointForecastRequiredCodeRule implements ScheduledTouchpointForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledTouchpointForecast): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledTouchpointForecastFloorValueRangeRule implements ScheduledTouchpointForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledTouchpointForecast): string[] {
    const value = item.floorValue;
    if (value < this.min || value > this.max) return [`floor value ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ScheduledTouchpointForecastLabelLengthRule implements ScheduledTouchpointForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledTouchpointForecast): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledTouchpointForecastRequiredCountryRule implements ScheduledTouchpointForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledTouchpointForecast): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledTouchpointForecastDurationMinutesRangeRule implements ScheduledTouchpointForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledTouchpointForecast): string[] {
    const value = item.durationMinutes;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`duration minutes ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`duration minutes ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ScheduledTouchpointForecastGraceDaysRangeRule implements ScheduledTouchpointForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledTouchpointForecast): string[] {
    const value = item.graceDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`grace days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`grace days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a scheduled touchpoint forecast. */
export class ScheduledTouchpointForecastValidator {
  rules: ScheduledTouchpointForecastRule[];

  constructor(rules: ScheduledTouchpointForecastRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledTouchpointForecast): string[] {
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

  requireValid(item: ScheduledTouchpointForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledTouchpointForecast[]): Map<string, string[]> {
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

export function defaultScheduledTouchpointForecastValidator(): ScheduledTouchpointForecastValidator {
  return new ScheduledTouchpointForecastValidator(
    [
      new ScheduledTouchpointForecastRequiredCodeRule("scheduled touchpoint forecast needs this field"),
      new ScheduledTouchpointForecastFloorValueRangeRule(5.5, 2604.7),
      new ScheduledTouchpointForecastLabelLengthRule(255),
      new ScheduledTouchpointForecastRequiredCountryRule("scheduled touchpoint forecast needs a value"),
      new ScheduledTouchpointForecastDurationMinutesRangeRule(16, 120),
      new ScheduledTouchpointForecastGraceDaysRangeRule(32, 80),
    ],
  );
}
