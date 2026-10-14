import { SenderForecast } from "./sender-forecast.js";

/** A rule a sender forecast must pass. Check returns its problems, or none. */
export interface SenderForecastRule {
  check(item: SenderForecast): string[];
}

export class SenderForecastRequiredChannelRule implements SenderForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SenderForecast): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class SenderForecastGraceDaysRangeRule implements SenderForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SenderForecast): string[] {
    const value = item.graceDays;
    if (value < this.min || value > this.max) return [`grace days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SenderForecastCodePrefixRule implements SenderForecastRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SenderForecast): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SenderForecastRequiredReviewerRule implements SenderForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SenderForecast): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class SenderForecastPinnedGuardRule implements SenderForecastRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: SenderForecast): string[] {
    if (item.pinned && item.threshold > this.limit) return [`threshold ${item.threshold} exceeds ${this.limit} while pinned`];
    return [];
  }
}

/** Runs every rule of a sender forecast. */
export class SenderForecastValidator {
  rules: SenderForecastRule[];

  constructor(rules: SenderForecastRule[]) {
    this.rules = rules;
  }

  validate(item: SenderForecast): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SenderForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SenderForecast[]): Map<string, string[]> {
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

export function defaultSenderForecastValidator(): SenderForecastValidator {
  return new SenderForecastValidator(
    [
      new SenderForecastRequiredChannelRule("sender forecast needs this field"),
      new SenderForecastGraceDaysRangeRule(80, 120),
      new SenderForecastCodePrefixRule("OPS"),
      new SenderForecastRequiredReviewerRule("sender forecast needs a value"),
      new SenderForecastPinnedGuardRule(2.7),
    ],
  );
}
