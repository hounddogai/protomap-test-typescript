import { PendingSuppressionForecast } from "./pending-suppression-forecast.js";

/** A rule a pending suppression forecast must pass. Check returns its problems, or none. */
export interface PendingSuppressionForecastRule {
  check(item: PendingSuppressionForecast): string[];
}

export class PendingSuppressionForecastCodePrefixRule implements PendingSuppressionForecastRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PendingSuppressionForecast): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PendingSuppressionForecastCodeLengthRule implements PendingSuppressionForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingSuppressionForecast): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingSuppressionForecastLabelLengthRule implements PendingSuppressionForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingSuppressionForecast): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingSuppressionForecastRequiredTitleRule implements PendingSuppressionForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingSuppressionForecast): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class PendingSuppressionForecastRequiredUnitRule implements PendingSuppressionForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingSuppressionForecast): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a pending suppression forecast. */
export class PendingSuppressionForecastValidator {
  rules: PendingSuppressionForecastRule[];

  constructor(rules: PendingSuppressionForecastRule[]) {
    this.rules = rules;
  }

  validate(item: PendingSuppressionForecast): string[] {
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

  requireValid(item: PendingSuppressionForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingSuppressionForecast[]): Map<string, string[]> {
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

export function defaultPendingSuppressionForecastValidator(): PendingSuppressionForecastValidator {
  return new PendingSuppressionForecastValidator(
    [
      new PendingSuppressionForecastCodePrefixRule("ACM"),
      new PendingSuppressionForecastCodeLengthRule(32),
      new PendingSuppressionForecastLabelLengthRule(80),
      new PendingSuppressionForecastRequiredTitleRule("pending suppression forecast needs this field"),
      new PendingSuppressionForecastRequiredUnitRule("pending suppression forecast needs a value"),
    ],
  );
}
