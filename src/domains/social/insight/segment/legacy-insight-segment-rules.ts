import * as text from "../../../../kit/text.js";
import { LegacyInsightSegment } from "./legacy-insight-segment.js";

/** A rule a legacy insight segment must pass. Check returns its problems, or none. */
export interface LegacyInsightSegmentRule {
  check(item: LegacyInsightSegment): string[];
}

export class LegacyInsightSegmentTitleLengthRule implements LegacyInsightSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyInsightSegment): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyInsightSegmentRequiredJourneyIdRule implements LegacyInsightSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyInsightSegment): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyInsightSegmentAllowedCodeRule implements LegacyInsightSegmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LegacyInsightSegment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is stale`];
    return [];
  }
}

export class LegacyInsightSegmentCodePrefixRule implements LegacyInsightSegmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LegacyInsightSegment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LegacyInsightSegmentJourneyIdLengthRule implements LegacyInsightSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyInsightSegment): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyInsightSegmentRequiredTitleRule implements LegacyInsightSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyInsightSegment): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a legacy insight segment. */
export class LegacyInsightSegmentValidator {
  rules: LegacyInsightSegmentRule[];

  constructor(rules: LegacyInsightSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyInsightSegment): string[] {
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

  requireValid(item: LegacyInsightSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyInsightSegment[]): Map<string, string[]> {
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

export function defaultLegacyInsightSegmentValidator(): LegacyInsightSegmentValidator {
  return new LegacyInsightSegmentValidator(
    [
      new LegacyInsightSegmentTitleLengthRule(32),
      new LegacyInsightSegmentRequiredJourneyIdRule("legacy insight segment needs this field"),
      new LegacyInsightSegmentAllowedCodeRule([]),
      new LegacyInsightSegmentCodePrefixRule("Q"),
      new LegacyInsightSegmentJourneyIdLengthRule(3600),
      new LegacyInsightSegmentRequiredTitleRule("legacy insight segment needs an entry"),
    ],
  );
}
