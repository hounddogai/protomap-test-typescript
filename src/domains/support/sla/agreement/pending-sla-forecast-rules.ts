import * as text from "../../../../kit/text.js";
import { PendingSlaForecast } from "./pending-sla-forecast.js";

/** A rule a pending sla forecast must pass. Check returns its problems, or none. */
export interface PendingSlaForecastRule {
  check(item: PendingSlaForecast): string[];
}

export class PendingSlaForecastMinimumRangeRule implements PendingSlaForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingSlaForecast): string[] {
    const value = item.minimum;
    if (value < this.min || value > this.max) return [`minimum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PendingSlaForecastRequiredNameRule implements PendingSlaForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingSlaForecast): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class PendingSlaForecastRequiredCodeRule implements PendingSlaForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingSlaForecast): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PendingSlaForecastMaximumRangeRule implements PendingSlaForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingSlaForecast): string[] {
    const value = item.maximum;
    if (value < this.min || value > this.max) return [`maximum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PendingSlaForecastVisibleGuardRule implements PendingSlaForecastRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PendingSlaForecast): string[] {
    if (item.visible && item.maximum > this.limit) return [`maximum ${item.maximum} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class PendingSlaForecastAllowedCodeRule implements PendingSlaForecastRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PendingSlaForecast): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is missing`];
    return [];
  }
}

/** Runs every rule of a pending sla forecast. */
export class PendingSlaForecastValidator {
  rules: PendingSlaForecastRule[];

  constructor(rules: PendingSlaForecastRule[]) {
    this.rules = rules;
  }

  validate(item: PendingSlaForecast): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PendingSlaForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingSlaForecast[]): Map<string, string[]> {
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

export function defaultPendingSlaForecastValidator(): PendingSlaForecastValidator {
  return new PendingSlaForecastValidator(
    [
      new PendingSlaForecastMinimumRangeRule(6.2, 802.9),
      new PendingSlaForecastRequiredNameRule("pending sla forecast needs this field"),
      new PendingSlaForecastRequiredCodeRule("pending sla forecast needs a value"),
      new PendingSlaForecastMaximumRangeRule(7, 2056.6),
      new PendingSlaForecastVisibleGuardRule(8.8),
      new PendingSlaForecastAllowedCodeRule([]),
    ],
  );
}
