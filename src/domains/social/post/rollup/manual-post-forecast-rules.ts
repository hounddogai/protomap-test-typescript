import * as text from "../../../../kit/text.js";
import { ManualPostForecast } from "./manual-post-forecast.js";

/** A rule a manual post forecast must pass. Check returns its problems, or none. */
export interface ManualPostForecastRule {
  check(item: ManualPostForecast): string[];
}

export class ManualPostForecastRequiredSourceRule implements ManualPostForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualPostForecast): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

export class ManualPostForecastMinimumRangeRule implements ManualPostForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualPostForecast): string[] {
    const value = item.minimum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`minimum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`minimum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ManualPostForecastAllowedNameRule implements ManualPostForecastRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ManualPostForecast): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is below minimum`];
    return [];
  }
}

/** Runs every rule of a manual post forecast. */
export class ManualPostForecastValidator {
  rules: ManualPostForecastRule[];

  constructor(rules: ManualPostForecastRule[]) {
    this.rules = rules;
  }

  validate(item: ManualPostForecast): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualPostForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualPostForecast[]): Map<string, string[]> {
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

export function defaultManualPostForecastValidator(): ManualPostForecastValidator {
  return new ManualPostForecastValidator(
    [
      new ManualPostForecastRequiredSourceRule("manual post forecast needs this field"),
      new ManualPostForecastMinimumRangeRule(1.2, 3101.9),
      new ManualPostForecastAllowedNameRule(["adaptive", "primary", "seasonal"]),
    ],
  );
}
