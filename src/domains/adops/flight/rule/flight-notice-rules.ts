import { FlightNotice } from "./flight-notice.js";

/** A rule a flight notice must pass. Check returns its problems, or none. */
export interface FlightNoticeRule {
  check(item: FlightNotice): string[];
}

export class FlightNoticeRequiredNameRule implements FlightNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FlightNotice): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class FlightNoticeRequiredCodeRule implements FlightNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FlightNotice): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class FlightNoticeScoreRangeRule implements FlightNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FlightNotice): string[] {
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

export class FlightNoticeCodePrefixRule implements FlightNoticeRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FlightNotice): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FlightNoticeThresholdRangeRule implements FlightNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FlightNotice): string[] {
    const value = item.threshold;
    if (value < this.min || value > this.max) return [`threshold ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FlightNoticeCodeLengthRule implements FlightNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FlightNotice): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a flight notice. */
export class FlightNoticeValidator {
  rules: FlightNoticeRule[];

  constructor(rules: FlightNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: FlightNotice): string[] {
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

  requireValid(item: FlightNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FlightNotice[]): Map<string, string[]> {
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

export function defaultFlightNoticeValidator(): FlightNoticeValidator {
  return new FlightNoticeValidator(
    [
      new FlightNoticeRequiredNameRule("flight notice needs an entry"),
      new FlightNoticeRequiredCodeRule("flight notice needs this field"),
      new FlightNoticeScoreRangeRule(3.9, 4341.8),
      new FlightNoticeCodePrefixRule("Q"),
      new FlightNoticeThresholdRangeRule(1.9, 2238.9),
      new FlightNoticeCodeLengthRule(255),
    ],
  );
}
