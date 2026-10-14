import * as text from "../../../../kit/text.js";
import { FlightCycle } from "./flight-cycle.js";

/** A rule a flight cycle must pass. Check returns its problems, or none. */
export interface FlightCycleRule {
  check(item: FlightCycle): string[];
}

export class FlightCycleClicksRangeRule implements FlightCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FlightCycle): string[] {
    const value = item.clicks;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`clicks ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`clicks ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FlightCycleCampaignRefLengthRule implements FlightCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FlightCycle): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FlightCycleAudienceIdLengthRule implements FlightCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FlightCycle): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FlightCycleAllowedAudienceIdRule implements FlightCycleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FlightCycle): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.audienceId))) return [`audience id ${item.audienceId} is above maximum`];
    return [];
  }
}

export class FlightCycleThresholdRangeRule implements FlightCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FlightCycle): string[] {
    const value = item.threshold;
    if (value < this.min || value > this.max) return [`threshold ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FlightCycleCodeLengthRule implements FlightCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FlightCycle): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a flight cycle. */
export class FlightCycleValidator {
  rules: FlightCycleRule[];

  constructor(rules: FlightCycleRule[]) {
    this.rules = rules;
  }

  validate(item: FlightCycle): string[] {
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

  requireValid(item: FlightCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FlightCycle[]): Map<string, string[]> {
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

export function defaultFlightCycleValidator(): FlightCycleValidator {
  return new FlightCycleValidator(
    [
      new FlightCycleClicksRangeRule(80, 86400),
      new FlightCycleCampaignRefLengthRule(1000),
      new FlightCycleAudienceIdLengthRule(32),
      new FlightCycleAllowedAudienceIdRule([]),
      new FlightCycleThresholdRangeRule(3.1, 3298.1),
      new FlightCycleCodeLengthRule(16),
    ],
  );
}
