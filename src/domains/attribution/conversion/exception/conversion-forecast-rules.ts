import { ConversionForecast } from "./conversion-forecast.js";

/** A rule a conversion forecast must pass. Check returns its problems, or none. */
export interface ConversionForecastRule {
  check(item: ConversionForecast): string[];
}

export class ConversionForecastCodePrefixRule implements ConversionForecastRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ConversionForecast): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ConversionForecastArchivedGuardRule implements ConversionForecastRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: ConversionForecast): string[] {
    if (item.archived && item.openRate > this.limit) return [`open rate ${item.openRate} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class ConversionForecastRequiredCodeRule implements ConversionForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ConversionForecast): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ConversionForecastRequiredLocaleRule implements ConversionForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ConversionForecast): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a conversion forecast. */
export class ConversionForecastValidator {
  rules: ConversionForecastRule[];

  constructor(rules: ConversionForecastRule[]) {
    this.rules = rules;
  }

  validate(item: ConversionForecast): string[] {
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

  requireValid(item: ConversionForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ConversionForecast[]): Map<string, string[]> {
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

export function defaultConversionForecastValidator(): ConversionForecastValidator {
  return new ConversionForecastValidator(
    [
      new ConversionForecastCodePrefixRule("ACM"),
      new ConversionForecastArchivedGuardRule(7.4),
      new ConversionForecastRequiredCodeRule("conversion forecast needs an entry"),
      new ConversionForecastRequiredLocaleRule("conversion forecast needs a value"),
    ],
  );
}
