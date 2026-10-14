import * as text from "../../../../kit/text.js";
import { LenientWaitBaseline } from "./lenient-wait-baseline.js";

/** A rule a lenient wait baseline must pass. Check returns its problems, or none. */
export interface LenientWaitBaselineRule {
  check(item: LenientWaitBaseline): string[];
}

export class LenientWaitBaselineAudienceIdLengthRule implements LenientWaitBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientWaitBaseline): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientWaitBaselineRegionLengthRule implements LenientWaitBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientWaitBaseline): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientWaitBaselineDurationMinutesRangeRule implements LenientWaitBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientWaitBaseline): string[] {
    const value = item.durationMinutes;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`duration minutes ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`duration minutes ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LenientWaitBaselineAllowedCodeRule implements LenientWaitBaselineRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LenientWaitBaseline): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is above maximum`];
    return [];
  }
}

/** Runs every rule of a lenient wait baseline. */
export class LenientWaitBaselineValidator {
  rules: LenientWaitBaselineRule[];

  constructor(rules: LenientWaitBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: LenientWaitBaseline): string[] {
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

  requireValid(item: LenientWaitBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientWaitBaseline[]): Map<string, string[]> {
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

export function defaultLenientWaitBaselineValidator(): LenientWaitBaselineValidator {
  return new LenientWaitBaselineValidator(
    [
      new LenientWaitBaselineAudienceIdLengthRule(64),
      new LenientWaitBaselineRegionLengthRule(120),
      new LenientWaitBaselineDurationMinutesRangeRule(32, 255),
      new LenientWaitBaselineAllowedCodeRule(["default", "adaptive", "pending"]),
    ],
  );
}
