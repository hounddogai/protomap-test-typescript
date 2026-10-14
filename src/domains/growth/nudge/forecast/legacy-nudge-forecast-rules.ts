import * as text from "../../../../kit/text.js";
import { LegacyNudgeForecast } from "./legacy-nudge-forecast.js";

/** A rule a legacy nudge forecast must pass. Check returns its problems, or none. */
export interface LegacyNudgeForecastRule {
  check(item: LegacyNudgeForecast): string[];
}

export class LegacyNudgeForecastCodeLengthRule implements LegacyNudgeForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyNudgeForecast): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyNudgeForecastCodePrefixRule implements LegacyNudgeForecastRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LegacyNudgeForecast): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LegacyNudgeForecastAllowedNameRule implements LegacyNudgeForecastRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LegacyNudgeForecast): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is stale`];
    return [];
  }
}

export class LegacyNudgeForecastRequiredLabelRule implements LegacyNudgeForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyNudgeForecast): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyNudgeForecastNameLengthRule implements LegacyNudgeForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyNudgeForecast): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyNudgeForecastLabelLengthRule implements LegacyNudgeForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyNudgeForecast): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a legacy nudge forecast. */
export class LegacyNudgeForecastValidator {
  rules: LegacyNudgeForecastRule[];

  constructor(rules: LegacyNudgeForecastRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyNudgeForecast): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacyNudgeForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyNudgeForecast[]): Map<string, string[]> {
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

export function defaultLegacyNudgeForecastValidator(): LegacyNudgeForecastValidator {
  return new LegacyNudgeForecastValidator(
    [
      new LegacyNudgeForecastCodeLengthRule(64),
      new LegacyNudgeForecastCodePrefixRule("REF"),
      new LegacyNudgeForecastAllowedNameRule([]),
      new LegacyNudgeForecastRequiredLabelRule("legacy nudge forecast needs an entry"),
      new LegacyNudgeForecastNameLengthRule(1000),
      new LegacyNudgeForecastLabelLengthRule(3600),
    ],
  );
}
