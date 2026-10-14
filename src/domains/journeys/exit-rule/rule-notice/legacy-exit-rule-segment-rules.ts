import * as text from "../../../../kit/text.js";
import { LegacyExitRuleSegment } from "./legacy-exit-rule-segment.js";

/** A rule a legacy exit rule segment must pass. Check returns its problems, or none. */
export interface LegacyExitRuleSegmentRule {
  check(item: LegacyExitRuleSegment): string[];
}

export class LegacyExitRuleSegmentVersionRangeRule implements LegacyExitRuleSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyExitRuleSegment): string[] {
    const value = item.version;
    if (value < this.min || value > this.max) return [`version ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LegacyExitRuleSegmentRequiredSummaryRule implements LegacyExitRuleSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyExitRuleSegment): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyExitRuleSegmentImpressionsRangeRule implements LegacyExitRuleSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyExitRuleSegment): string[] {
    const value = item.impressions;
    if (value < this.min || value > this.max) return [`impressions ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LegacyExitRuleSegmentDescriptionLengthRule implements LegacyExitRuleSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyExitRuleSegment): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyExitRuleSegmentMinimumRangeRule implements LegacyExitRuleSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyExitRuleSegment): string[] {
    const value = item.minimum;
    if (value < this.min || value > this.max) return [`minimum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LegacyExitRuleSegmentAllowedCodeRule implements LegacyExitRuleSegmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LegacyExitRuleSegment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is not allowed`];
    return [];
  }
}

/** Runs every rule of a legacy exit rule segment. */
export class LegacyExitRuleSegmentValidator {
  rules: LegacyExitRuleSegmentRule[];

  constructor(rules: LegacyExitRuleSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyExitRuleSegment): string[] {
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

  requireValid(item: LegacyExitRuleSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyExitRuleSegment[]): Map<string, string[]> {
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

export function defaultLegacyExitRuleSegmentValidator(): LegacyExitRuleSegmentValidator {
  return new LegacyExitRuleSegmentValidator(
    [
      new LegacyExitRuleSegmentVersionRangeRule(120, 120),
      new LegacyExitRuleSegmentRequiredSummaryRule("legacy exit rule segment needs a value"),
      new LegacyExitRuleSegmentImpressionsRangeRule(64, 64),
      new LegacyExitRuleSegmentDescriptionLengthRule(16),
      new LegacyExitRuleSegmentMinimumRangeRule(9.9, 3817.8),
      new LegacyExitRuleSegmentAllowedCodeRule(["tiered", "tiered"]),
    ],
  );
}
