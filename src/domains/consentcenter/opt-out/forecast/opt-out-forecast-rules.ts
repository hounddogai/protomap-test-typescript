import * as text from "../../../../kit/text.js";
import { OptOutForecast } from "./opt-out-forecast.js";

/** A rule a opt out forecast must pass. Check returns its problems, or none. */
export interface OptOutForecastRule {
  check(item: OptOutForecast): string[];
}

export class OptOutForecastNameLengthRule implements OptOutForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: OptOutForecast): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class OptOutForecastRequiredNameRule implements OptOutForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: OptOutForecast): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class OptOutForecastRequiredLabelRule implements OptOutForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: OptOutForecast): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class OptOutForecastCodeLengthRule implements OptOutForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: OptOutForecast): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class OptOutForecastLabelLengthRule implements OptOutForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: OptOutForecast): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class OptOutForecastAllowedLabelRule implements OptOutForecastRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: OptOutForecast): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is inconsistent`];
    return [];
  }
}

/** Runs every rule of a opt out forecast. */
export class OptOutForecastValidator {
  rules: OptOutForecastRule[];

  constructor(rules: OptOutForecastRule[]) {
    this.rules = rules;
  }

  validate(item: OptOutForecast): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: OptOutForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: OptOutForecast[]): Map<string, string[]> {
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

export function defaultOptOutForecastValidator(): OptOutForecastValidator {
  return new OptOutForecastValidator(
    [
      new OptOutForecastNameLengthRule(255),
      new OptOutForecastRequiredNameRule("opt out forecast needs a value"),
      new OptOutForecastRequiredLabelRule("opt out forecast needs this field"),
      new OptOutForecastCodeLengthRule(3600),
      new OptOutForecastLabelLengthRule(120),
      new OptOutForecastAllowedLabelRule(["pending", "strict"]),
    ],
  );
}
