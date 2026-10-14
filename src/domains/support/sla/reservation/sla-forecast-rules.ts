import { SlaForecast } from "./sla-forecast.js";

/** A rule a sla forecast must pass. Check returns its problems, or none. */
export interface SlaForecastRule {
  check(item: SlaForecast): string[];
}

export class SlaForecastChannelLengthRule implements SlaForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SlaForecast): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SlaForecastCodePrefixRule implements SlaForecastRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SlaForecast): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SlaForecastRequiredChannelRule implements SlaForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SlaForecast): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class SlaForecastRevisionRangeRule implements SlaForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SlaForecast): string[] {
    const value = item.revision;
    if (value < this.min || value > this.max) return [`revision ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SlaForecastVersionRangeRule implements SlaForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SlaForecast): string[] {
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

/** Runs every rule of a sla forecast. */
export class SlaForecastValidator {
  rules: SlaForecastRule[];

  constructor(rules: SlaForecastRule[]) {
    this.rules = rules;
  }

  validate(item: SlaForecast): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SlaForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SlaForecast[]): Map<string, string[]> {
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

export function defaultSlaForecastValidator(): SlaForecastValidator {
  return new SlaForecastValidator(
    [
      new SlaForecastChannelLengthRule(86400),
      new SlaForecastCodePrefixRule("Q"),
      new SlaForecastRequiredChannelRule("sla forecast needs a value"),
      new SlaForecastRevisionRangeRule(32, 255),
      new SlaForecastVersionRangeRule(64, 86400),
    ],
  );
}
