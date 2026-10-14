import * as text from "../../../../kit/text.js";
import { RegionalNudgeBaseline } from "./regional-nudge-baseline.js";

/** A rule a regional nudge baseline must pass. Check returns its problems, or none. */
export interface RegionalNudgeBaselineRule {
  check(item: RegionalNudgeBaseline): string[];
}

export class RegionalNudgeBaselineSendAtRangeRule implements RegionalNudgeBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalNudgeBaseline): string[] {
    const value = item.sendAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`send at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`send at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RegionalNudgeBaselineUtmSourceLengthRule implements RegionalNudgeBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalNudgeBaseline): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalNudgeBaselineAllowedCodeRule implements RegionalNudgeBaselineRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RegionalNudgeBaseline): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is blocked`];
    return [];
  }
}

/** Runs every rule of a regional nudge baseline. */
export class RegionalNudgeBaselineValidator {
  rules: RegionalNudgeBaselineRule[];

  constructor(rules: RegionalNudgeBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalNudgeBaseline): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RegionalNudgeBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalNudgeBaseline[]): Map<string, string[]> {
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

export function defaultRegionalNudgeBaselineValidator(): RegionalNudgeBaselineValidator {
  return new RegionalNudgeBaselineValidator(
    [
      new RegionalNudgeBaselineSendAtRangeRule(80, 86400),
      new RegionalNudgeBaselineUtmSourceLengthRule(64),
      new RegionalNudgeBaselineAllowedCodeRule(["tiered"]),
    ],
  );
}
