import * as text from "../../../../kit/text.js";
import { ManualPreferenceSegment } from "./manual-preference-segment.js";

/** A rule a manual preference segment must pass. Check returns its problems, or none. */
export interface ManualPreferenceSegmentRule {
  check(item: ManualPreferenceSegment): string[];
}

export class ManualPreferenceSegmentCodeLengthRule implements ManualPreferenceSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualPreferenceSegment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualPreferenceSegmentNameLengthRule implements ManualPreferenceSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualPreferenceSegment): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualPreferenceSegmentCodePrefixRule implements ManualPreferenceSegmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ManualPreferenceSegment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ManualPreferenceSegmentAllowedAudienceIdRule implements ManualPreferenceSegmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ManualPreferenceSegment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.audienceId))) return [`audience id ${item.audienceId} is blocked`];
    return [];
  }
}

export class ManualPreferenceSegmentRequiredNotesRule implements ManualPreferenceSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualPreferenceSegment): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

export class ManualPreferenceSegmentStartsAtRangeRule implements ManualPreferenceSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualPreferenceSegment): string[] {
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

/** Runs every rule of a manual preference segment. */
export class ManualPreferenceSegmentValidator {
  rules: ManualPreferenceSegmentRule[];

  constructor(rules: ManualPreferenceSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: ManualPreferenceSegment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualPreferenceSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualPreferenceSegment[]): Map<string, string[]> {
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

export function defaultManualPreferenceSegmentValidator(): ManualPreferenceSegmentValidator {
  return new ManualPreferenceSegmentValidator(
    [
      new ManualPreferenceSegmentCodeLengthRule(16),
      new ManualPreferenceSegmentNameLengthRule(16),
      new ManualPreferenceSegmentCodePrefixRule("OPS"),
      new ManualPreferenceSegmentAllowedAudienceIdRule([]),
      new ManualPreferenceSegmentRequiredNotesRule("manual preference segment needs this field"),
      new ManualPreferenceSegmentStartsAtRangeRule(16, 32),
    ],
  );
}
