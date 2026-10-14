import * as text from "../../../../kit/text.js";
import { SeasonalSuppressionSegment } from "./seasonal-suppression-segment.js";

/** A rule a seasonal suppression segment must pass. Check returns its problems, or none. */
export interface SeasonalSuppressionSegmentRule {
  check(item: SeasonalSuppressionSegment): string[];
}

export class SeasonalSuppressionSegmentRequiredAudienceIdRule implements SeasonalSuppressionSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalSuppressionSegment): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalSuppressionSegmentAllowedCodeRule implements SeasonalSuppressionSegmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SeasonalSuppressionSegment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is above maximum`];
    return [];
  }
}

export class SeasonalSuppressionSegmentExpiresAtRangeRule implements SeasonalSuppressionSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalSuppressionSegment): string[] {
    const value = item.expiresAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`expires at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`expires at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SeasonalSuppressionSegmentAudienceIdLengthRule implements SeasonalSuppressionSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalSuppressionSegment): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a seasonal suppression segment. */
export class SeasonalSuppressionSegmentValidator {
  rules: SeasonalSuppressionSegmentRule[];

  constructor(rules: SeasonalSuppressionSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalSuppressionSegment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SeasonalSuppressionSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalSuppressionSegment[]): Map<string, string[]> {
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

export function defaultSeasonalSuppressionSegmentValidator(): SeasonalSuppressionSegmentValidator {
  return new SeasonalSuppressionSegmentValidator(
    [
      new SeasonalSuppressionSegmentRequiredAudienceIdRule("seasonal suppression segment needs this field"),
      new SeasonalSuppressionSegmentAllowedCodeRule(["strict"]),
      new SeasonalSuppressionSegmentExpiresAtRangeRule(16, 32),
      new SeasonalSuppressionSegmentAudienceIdLengthRule(120),
    ],
  );
}
