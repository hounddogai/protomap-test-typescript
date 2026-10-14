import * as text from "../../../../kit/text.js";
import { RegionalPacingForecast } from "./regional-pacing-forecast.js";

/** A rule a regional pacing forecast must pass. Check returns its problems, or none. */
export interface RegionalPacingForecastRule {
  check(item: RegionalPacingForecast): string[];
}

export class RegionalPacingForecastScoreRangeRule implements RegionalPacingForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalPacingForecast): string[] {
    const value = item.score;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`score ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`score ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RegionalPacingForecastAllowedChecksumRule implements RegionalPacingForecastRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RegionalPacingForecast): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.checksum))) return [`checksum ${item.checksum} is out of range`];
    return [];
  }
}

export class RegionalPacingForecastChecksumLengthRule implements RegionalPacingForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalPacingForecast): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalPacingForecastDescriptionLengthRule implements RegionalPacingForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalPacingForecast): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalPacingForecastRequiredChecksumRule implements RegionalPacingForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalPacingForecast): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a regional pacing forecast. */
export class RegionalPacingForecastValidator {
  rules: RegionalPacingForecastRule[];

  constructor(rules: RegionalPacingForecastRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalPacingForecast): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RegionalPacingForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalPacingForecast[]): Map<string, string[]> {
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

export function defaultRegionalPacingForecastValidator(): RegionalPacingForecastValidator {
  return new RegionalPacingForecastValidator(
    [
      new RegionalPacingForecastScoreRangeRule(5.6, 3039.8),
      new RegionalPacingForecastAllowedChecksumRule(["adaptive", "weighted"]),
      new RegionalPacingForecastChecksumLengthRule(3600),
      new RegionalPacingForecastDescriptionLengthRule(255),
      new RegionalPacingForecastRequiredChecksumRule("regional pacing forecast needs an entry"),
    ],
  );
}
