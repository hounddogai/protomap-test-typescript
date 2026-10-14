import * as text from "../../../../kit/text.js";
import { OptOutCycle } from "./opt-out-cycle.js";

/** A rule a opt out cycle must pass. Check returns its problems, or none. */
export interface OptOutCycleRule {
  check(item: OptOutCycle): string[];
}

export class OptOutCycleStartsAtRangeRule implements OptOutCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: OptOutCycle): string[] {
    const value = item.startsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`starts at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`starts at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class OptOutCycleCodeLengthRule implements OptOutCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: OptOutCycle): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class OptOutCycleTitleLengthRule implements OptOutCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: OptOutCycle): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class OptOutCycleRequiredSummaryRule implements OptOutCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: OptOutCycle): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

export class OptOutCycleSummaryLengthRule implements OptOutCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: OptOutCycle): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class OptOutCycleAllowedTimezoneRule implements OptOutCycleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: OptOutCycle): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.timezone))) return [`timezone ${item.timezone} is missing`];
    return [];
  }
}

/** Runs every rule of a opt out cycle. */
export class OptOutCycleValidator {
  rules: OptOutCycleRule[];

  constructor(rules: OptOutCycleRule[]) {
    this.rules = rules;
  }

  validate(item: OptOutCycle): string[] {
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

  requireValid(item: OptOutCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: OptOutCycle[]): Map<string, string[]> {
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

export function defaultOptOutCycleValidator(): OptOutCycleValidator {
  return new OptOutCycleValidator(
    [
      new OptOutCycleStartsAtRangeRule(64, 1000),
      new OptOutCycleCodeLengthRule(64),
      new OptOutCycleTitleLengthRule(255),
      new OptOutCycleRequiredSummaryRule("opt out cycle needs this field"),
      new OptOutCycleSummaryLengthRule(80),
      new OptOutCycleAllowedTimezoneRule(["manual"]),
    ],
  );
}
