import { QueueForecast } from "./queue-forecast.js";

/** A rule a queue forecast must pass. Check returns its problems, or none. */
export interface QueueForecastRule {
  check(item: QueueForecast): string[];
}

export class QueueForecastCodePrefixRule implements QueueForecastRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: QueueForecast): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class QueueForecastCodeLengthRule implements QueueForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: QueueForecast): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class QueueForecastRequiredPhoneRule implements QueueForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: QueueForecast): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a queue forecast. */
export class QueueForecastValidator {
  rules: QueueForecastRule[];

  constructor(rules: QueueForecastRule[]) {
    this.rules = rules;
  }

  validate(item: QueueForecast): string[] {
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

  requireValid(item: QueueForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: QueueForecast[]): Map<string, string[]> {
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

export function defaultQueueForecastValidator(): QueueForecastValidator {
  return new QueueForecastValidator(
    [
      new QueueForecastCodePrefixRule("X"),
      new QueueForecastCodeLengthRule(120),
      new QueueForecastRequiredPhoneRule("queue forecast needs a value"),
    ],
  );
}
