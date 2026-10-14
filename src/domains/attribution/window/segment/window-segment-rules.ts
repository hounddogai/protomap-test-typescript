import * as text from "../../../../kit/text.js";
import { WindowSegment } from "./window-segment.js";

/** A rule a window segment must pass. Check returns its problems, or none. */
export interface WindowSegmentRule {
  check(item: WindowSegment): string[];
}

export class WindowSegmentBudgetRangeRule implements WindowSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WindowSegment): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WindowSegmentContactEmailLengthRule implements WindowSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WindowSegment): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WindowSegmentRequiredCodeRule implements WindowSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WindowSegment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class WindowSegmentFloorValueRangeRule implements WindowSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WindowSegment): string[] {
    const value = item.floorValue;
    if (value < this.min || value > this.max) return [`floor value ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WindowSegmentLimitRangeRule implements WindowSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WindowSegment): string[] {
    const value = item.limit;
    if (value < this.min || value > this.max) return [`limit ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WindowSegmentAllowedUtmSourceRule implements WindowSegmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WindowSegment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.utmSource))) return [`utm source ${item.utmSource} is duplicated`];
    return [];
  }
}

/** Runs every rule of a window segment. */
export class WindowSegmentValidator {
  rules: WindowSegmentRule[];

  constructor(rules: WindowSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: WindowSegment): string[] {
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

  requireValid(item: WindowSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WindowSegment[]): Map<string, string[]> {
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

export function defaultWindowSegmentValidator(): WindowSegmentValidator {
  return new WindowSegmentValidator(
    [
      new WindowSegmentBudgetRangeRule(0.8, 1214.9),
      new WindowSegmentContactEmailLengthRule(1000),
      new WindowSegmentRequiredCodeRule("window segment needs an entry"),
      new WindowSegmentFloorValueRangeRule(6.5, 3366.4),
      new WindowSegmentLimitRangeRule(255, 1000),
      new WindowSegmentAllowedUtmSourceRule(["legacy", "tiered"]),
    ],
  );
}
