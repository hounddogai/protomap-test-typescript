import * as text from "../../../../kit/text.js";
import { BatchedJourneyDigest } from "./batched-journey-digest.js";

/** A rule a batched journey digest must pass. Check returns its problems, or none. */
export interface BatchedJourneyDigestRule {
  check(item: BatchedJourneyDigest): string[];
}

export class BatchedJourneyDigestAllowedAudienceIdRule implements BatchedJourneyDigestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BatchedJourneyDigest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.audienceId))) return [`audience id ${item.audienceId} is not allowed`];
    return [];
  }
}

export class BatchedJourneyDigestRequiredCodeRule implements BatchedJourneyDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedJourneyDigest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedJourneyDigestSendAtRangeRule implements BatchedJourneyDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedJourneyDigest): string[] {
    const value = item.sendAt;
    if (value < this.min || value > this.max) return [`send at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BatchedJourneyDigestLabelLengthRule implements BatchedJourneyDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedJourneyDigest): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedJourneyDigestImpressionsRangeRule implements BatchedJourneyDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedJourneyDigest): string[] {
    const value = item.impressions;
    if (value < this.min || value > this.max) return [`impressions ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BatchedJourneyDigestFrequencyCapRangeRule implements BatchedJourneyDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedJourneyDigest): string[] {
    const value = item.frequencyCap;
    if (value < this.min || value > this.max) return [`frequency cap ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a batched journey digest. */
export class BatchedJourneyDigestValidator {
  rules: BatchedJourneyDigestRule[];

  constructor(rules: BatchedJourneyDigestRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedJourneyDigest): string[] {
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

  requireValid(item: BatchedJourneyDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedJourneyDigest[]): Map<string, string[]> {
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

export function defaultBatchedJourneyDigestValidator(): BatchedJourneyDigestValidator {
  return new BatchedJourneyDigestValidator(
    [
      new BatchedJourneyDigestAllowedAudienceIdRule([]),
      new BatchedJourneyDigestRequiredCodeRule("batched journey digest needs a value"),
      new BatchedJourneyDigestSendAtRangeRule(64, 120),
      new BatchedJourneyDigestLabelLengthRule(255),
      new BatchedJourneyDigestImpressionsRangeRule(16, 1000),
      new BatchedJourneyDigestFrequencyCapRangeRule(32, 86400),
    ],
  );
}
