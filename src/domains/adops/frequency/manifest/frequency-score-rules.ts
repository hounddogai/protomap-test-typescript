import * as text from "../../../../kit/text.js";
import { FrequencyScore } from "./frequency-score.js";

/** A rule a frequency score must pass. Check returns its problems, or none. */
export interface FrequencyScoreRule {
  check(item: FrequencyScore): string[];
}

export class FrequencyScoreRequiredAudienceIdRule implements FrequencyScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FrequencyScore): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

export class FrequencyScoreAllowedContactEmailRule implements FrequencyScoreRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FrequencyScore): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.contactEmail))) return [`contact email ${item.contactEmail} is out of range`];
    return [];
  }
}

export class FrequencyScoreRequiredCodeRule implements FrequencyScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FrequencyScore): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class FrequencyScoreLabelLengthRule implements FrequencyScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FrequencyScore): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FrequencyScoreCodePrefixRule implements FrequencyScoreRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FrequencyScore): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FrequencyScoreSegmentLengthRule implements FrequencyScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FrequencyScore): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a frequency score. */
export class FrequencyScoreValidator {
  rules: FrequencyScoreRule[];

  constructor(rules: FrequencyScoreRule[]) {
    this.rules = rules;
  }

  validate(item: FrequencyScore): string[] {
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

  requireValid(item: FrequencyScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FrequencyScore[]): Map<string, string[]> {
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

export function defaultFrequencyScoreValidator(): FrequencyScoreValidator {
  return new FrequencyScoreValidator(
    [
      new FrequencyScoreRequiredAudienceIdRule("frequency score needs this field"),
      new FrequencyScoreAllowedContactEmailRule([]),
      new FrequencyScoreRequiredCodeRule("frequency score needs a value"),
      new FrequencyScoreLabelLengthRule(64),
      new FrequencyScoreCodePrefixRule("Q"),
      new FrequencyScoreSegmentLengthRule(32),
    ],
  );
}
