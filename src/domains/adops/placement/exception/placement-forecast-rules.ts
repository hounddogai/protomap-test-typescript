import { PlacementForecast } from "./placement-forecast.js";

/** A rule a placement forecast must pass. Check returns its problems, or none. */
export interface PlacementForecastRule {
  check(item: PlacementForecast): string[];
}

export class PlacementForecastCodePrefixRule implements PlacementForecastRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PlacementForecast): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PlacementForecastRequiredPhoneRule implements PlacementForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PlacementForecast): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class PlacementForecastApprovedGuardRule implements PlacementForecastRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PlacementForecast): string[] {
    if (item.approved && item.maximum > this.limit) return [`maximum ${item.maximum} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class PlacementForecastTitleLengthRule implements PlacementForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PlacementForecast): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PlacementForecastMaximumRangeRule implements PlacementForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PlacementForecast): string[] {
    const value = item.maximum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`maximum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`maximum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PlacementForecastUtmSourceLengthRule implements PlacementForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PlacementForecast): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a placement forecast. */
export class PlacementForecastValidator {
  rules: PlacementForecastRule[];

  constructor(rules: PlacementForecastRule[]) {
    this.rules = rules;
  }

  validate(item: PlacementForecast): string[] {
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

  requireValid(item: PlacementForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PlacementForecast[]): Map<string, string[]> {
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

export function defaultPlacementForecastValidator(): PlacementForecastValidator {
  return new PlacementForecastValidator(
    [
      new PlacementForecastCodePrefixRule("OPS"),
      new PlacementForecastRequiredPhoneRule("placement forecast needs an entry"),
      new PlacementForecastApprovedGuardRule(0.2),
      new PlacementForecastTitleLengthRule(32),
      new PlacementForecastMaximumRangeRule(0.3, 290.9),
      new PlacementForecastUtmSourceLengthRule(80),
    ],
  );
}
