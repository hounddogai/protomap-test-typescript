import { FrequencyForecast } from "./frequency-forecast.js";

/** A rule a frequency forecast must pass. Check returns its problems, or none. */
export interface FrequencyForecastRule {
  check(item: FrequencyForecast): string[];
}

export class FrequencyForecastRequiredLabelRule implements FrequencyForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FrequencyForecast): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class FrequencyForecastCurrencyLengthRule implements FrequencyForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FrequencyForecast): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FrequencyForecastNotesLengthRule implements FrequencyForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FrequencyForecast): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FrequencyForecastVisibleGuardRule implements FrequencyForecastRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: FrequencyForecast): string[] {
    if (item.visible && item.minimum > this.limit) return [`minimum ${item.minimum} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class FrequencyForecastCodeLengthRule implements FrequencyForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FrequencyForecast): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FrequencyForecastCodePrefixRule implements FrequencyForecastRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FrequencyForecast): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a frequency forecast. */
export class FrequencyForecastValidator {
  rules: FrequencyForecastRule[];

  constructor(rules: FrequencyForecastRule[]) {
    this.rules = rules;
  }

  validate(item: FrequencyForecast): string[] {
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

  requireValid(item: FrequencyForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FrequencyForecast[]): Map<string, string[]> {
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

export function defaultFrequencyForecastValidator(): FrequencyForecastValidator {
  return new FrequencyForecastValidator(
    [
      new FrequencyForecastRequiredLabelRule("frequency forecast needs an entry"),
      new FrequencyForecastCurrencyLengthRule(86400),
      new FrequencyForecastNotesLengthRule(255),
      new FrequencyForecastVisibleGuardRule(7.3),
      new FrequencyForecastCodeLengthRule(255),
      new FrequencyForecastCodePrefixRule("OPS"),
    ],
  );
}
