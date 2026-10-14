import * as text from "../../../../kit/text.js";
import { ExitRuleForecast } from "./exit-rule-forecast.js";

/** A rule a exit rule forecast must pass. Check returns its problems, or none. */
export interface ExitRuleForecastRule {
  check(item: ExitRuleForecast): string[];
}

export class ExitRuleForecastCodePrefixRule implements ExitRuleForecastRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ExitRuleForecast): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ExitRuleForecastOwnerIdLengthRule implements ExitRuleForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ExitRuleForecast): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ExitRuleForecastCodeLengthRule implements ExitRuleForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ExitRuleForecast): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ExitRuleForecastRevisionRangeRule implements ExitRuleForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ExitRuleForecast): string[] {
    const value = item.revision;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`revision ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`revision ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ExitRuleForecastAllowedOwnerIdRule implements ExitRuleForecastRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ExitRuleForecast): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.ownerId))) return [`owner id ${item.ownerId} is not allowed`];
    return [];
  }
}

/** Runs every rule of a exit rule forecast. */
export class ExitRuleForecastValidator {
  rules: ExitRuleForecastRule[];

  constructor(rules: ExitRuleForecastRule[]) {
    this.rules = rules;
  }

  validate(item: ExitRuleForecast): string[] {
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

  requireValid(item: ExitRuleForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ExitRuleForecast[]): Map<string, string[]> {
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

export function defaultExitRuleForecastValidator(): ExitRuleForecastValidator {
  return new ExitRuleForecastValidator(
    [
      new ExitRuleForecastCodePrefixRule("OPS"),
      new ExitRuleForecastOwnerIdLengthRule(64),
      new ExitRuleForecastCodeLengthRule(255),
      new ExitRuleForecastRevisionRangeRule(32, 86400),
      new ExitRuleForecastAllowedOwnerIdRule(["legacy"]),
    ],
  );
}
