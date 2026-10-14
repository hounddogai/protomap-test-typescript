import * as text from "../../../../kit/text.js";
import { FlightThreshold } from "./flight-threshold.js";

/** A rule a flight threshold must pass. Check returns its problems, or none. */
export interface FlightThresholdRule {
  check(item: FlightThreshold): string[];
}

export class FlightThresholdAllowedCampaignRefRule implements FlightThresholdRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FlightThreshold): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.campaignRef))) return [`campaign ref ${item.campaignRef} is blocked`];
    return [];
  }
}

export class FlightThresholdRequiredCodeRule implements FlightThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FlightThreshold): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class FlightThresholdRatioRangeRule implements FlightThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FlightThreshold): string[] {
    const value = item.ratio;
    if (value < this.min || value > this.max) return [`ratio ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FlightThresholdExpiresAtRangeRule implements FlightThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FlightThreshold): string[] {
    const value = item.expiresAt;
    if (value < this.min || value > this.max) return [`expires at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FlightThresholdConversionRateRangeRule implements FlightThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FlightThreshold): string[] {
    const value = item.conversionRate;
    if (value < this.min || value > this.max) return [`conversion rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FlightThresholdRequiredSourceRule implements FlightThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FlightThreshold): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a flight threshold. */
export class FlightThresholdValidator {
  rules: FlightThresholdRule[];

  constructor(rules: FlightThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: FlightThreshold): string[] {
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

  requireValid(item: FlightThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FlightThreshold[]): Map<string, string[]> {
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

export function defaultFlightThresholdValidator(): FlightThresholdValidator {
  return new FlightThresholdValidator(
    [
      new FlightThresholdAllowedCampaignRefRule(["lenient"]),
      new FlightThresholdRequiredCodeRule("flight threshold needs a value"),
      new FlightThresholdRatioRangeRule(0.3, 1661.2),
      new FlightThresholdExpiresAtRangeRule(32, 1000),
      new FlightThresholdConversionRateRangeRule(1.7, 1912.9),
      new FlightThresholdRequiredSourceRule("flight threshold needs a value"),
    ],
  );
}
