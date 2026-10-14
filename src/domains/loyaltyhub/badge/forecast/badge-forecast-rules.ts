import { BadgeForecast } from "./badge-forecast.js";

/** A rule a badge forecast must pass. Check returns its problems, or none. */
export interface BadgeForecastRule {
  check(item: BadgeForecast): string[];
}

export class BadgeForecastCodeLengthRule implements BadgeForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BadgeForecast): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BadgeForecastRequiredUnitRule implements BadgeForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BadgeForecast): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

export class BadgeForecastRequiredLabelRule implements BadgeForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BadgeForecast): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class BadgeForecastUnitLengthRule implements BadgeForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BadgeForecast): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BadgeForecastRequiredCodeRule implements BadgeForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BadgeForecast): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BadgeForecastRequiredAudienceIdRule implements BadgeForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BadgeForecast): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a badge forecast. */
export class BadgeForecastValidator {
  rules: BadgeForecastRule[];

  constructor(rules: BadgeForecastRule[]) {
    this.rules = rules;
  }

  validate(item: BadgeForecast): string[] {
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

  requireValid(item: BadgeForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BadgeForecast[]): Map<string, string[]> {
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

export function defaultBadgeForecastValidator(): BadgeForecastValidator {
  return new BadgeForecastValidator(
    [
      new BadgeForecastCodeLengthRule(3600),
      new BadgeForecastRequiredUnitRule("badge forecast needs a value"),
      new BadgeForecastRequiredLabelRule("badge forecast needs an entry"),
      new BadgeForecastUnitLengthRule(1000),
      new BadgeForecastRequiredCodeRule("badge forecast needs this field"),
      new BadgeForecastRequiredAudienceIdRule("badge forecast needs this field"),
    ],
  );
}
