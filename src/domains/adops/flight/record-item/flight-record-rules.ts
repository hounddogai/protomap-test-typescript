import * as text from "../../../../kit/text.js";
import { FlightRecord } from "./flight-record.js";

/** A rule a flight record must pass. Check returns its problems, or none. */
export interface FlightRecordRule {
  check(item: FlightRecord): string[];
}

export class FlightRecordSegmentLengthRule implements FlightRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FlightRecord): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FlightRecordAllowedLabelRule implements FlightRecordRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FlightRecord): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is missing`];
    return [];
  }
}

export class FlightRecordLabelLengthRule implements FlightRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FlightRecord): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FlightRecordCodeLengthRule implements FlightRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FlightRecord): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FlightRecordCostRangeRule implements FlightRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FlightRecord): string[] {
    const value = item.cost;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`cost ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`cost ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a flight record. */
export class FlightRecordValidator {
  rules: FlightRecordRule[];

  constructor(rules: FlightRecordRule[]) {
    this.rules = rules;
  }

  validate(item: FlightRecord): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FlightRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FlightRecord[]): Map<string, string[]> {
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

export function defaultFlightRecordValidator(): FlightRecordValidator {
  return new FlightRecordValidator(
    [
      new FlightRecordSegmentLengthRule(120),
      new FlightRecordAllowedLabelRule(["rolling", "rolling"]),
      new FlightRecordLabelLengthRule(80),
      new FlightRecordCodeLengthRule(1000),
      new FlightRecordCostRangeRule(9, 3604.4),
    ],
  );
}
