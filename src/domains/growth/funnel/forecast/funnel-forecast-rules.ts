import * as text from "../../../../kit/text.js";
import { FunnelForecast } from "./funnel-forecast.js";

/** A rule a funnel forecast must pass. Check returns its problems, or none. */
export interface FunnelForecastRule {
  check(item: FunnelForecast): string[];
}

export class FunnelForecastCodeLengthRule implements FunnelForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FunnelForecast): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FunnelForecastRequiredLabelRule implements FunnelForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FunnelForecast): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class FunnelForecastCreatedAtRangeRule implements FunnelForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FunnelForecast): string[] {
    const value = item.createdAt;
    if (value < this.min || value > this.max) return [`created at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FunnelForecastAllowedDescriptionRule implements FunnelForecastRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FunnelForecast): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.description))) return [`description ${item.description} is blocked`];
    return [];
  }
}

export class FunnelForecastCodePrefixRule implements FunnelForecastRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FunnelForecast): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a funnel forecast. */
export class FunnelForecastValidator {
  rules: FunnelForecastRule[];

  constructor(rules: FunnelForecastRule[]) {
    this.rules = rules;
  }

  validate(item: FunnelForecast): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FunnelForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FunnelForecast[]): Map<string, string[]> {
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

export function defaultFunnelForecastValidator(): FunnelForecastValidator {
  return new FunnelForecastValidator(
    [
      new FunnelForecastCodeLengthRule(86400),
      new FunnelForecastRequiredLabelRule("funnel forecast needs this field"),
      new FunnelForecastCreatedAtRangeRule(3600, 3600),
      new FunnelForecastAllowedDescriptionRule(["primary", "adaptive", "capped"]),
      new FunnelForecastCodePrefixRule("OPS"),
    ],
  );
}
