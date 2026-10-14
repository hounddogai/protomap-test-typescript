import { AdaptiveInsightForecast } from "./adaptive-insight-forecast.js";

/** A rule a adaptive insight forecast must pass. Check returns its problems, or none. */
export interface AdaptiveInsightForecastRule {
  check(item: AdaptiveInsightForecast): string[];
}

export class AdaptiveInsightForecastNameLengthRule implements AdaptiveInsightForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveInsightForecast): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveInsightForecastArchivedGuardRule implements AdaptiveInsightForecastRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: AdaptiveInsightForecast): string[] {
    if (item.archived && item.quantity > this.limit) return [`quantity ${item.quantity} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class AdaptiveInsightForecastRequiredChannelRule implements AdaptiveInsightForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveInsightForecast): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveInsightForecastChannelLengthRule implements AdaptiveInsightForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveInsightForecast): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a adaptive insight forecast. */
export class AdaptiveInsightForecastValidator {
  rules: AdaptiveInsightForecastRule[];

  constructor(rules: AdaptiveInsightForecastRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveInsightForecast): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptiveInsightForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveInsightForecast[]): Map<string, string[]> {
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

export function defaultAdaptiveInsightForecastValidator(): AdaptiveInsightForecastValidator {
  return new AdaptiveInsightForecastValidator(
    [
      new AdaptiveInsightForecastNameLengthRule(16),
      new AdaptiveInsightForecastArchivedGuardRule(1000),
      new AdaptiveInsightForecastRequiredChannelRule("adaptive insight forecast needs a value"),
      new AdaptiveInsightForecastChannelLengthRule(255),
    ],
  );
}
