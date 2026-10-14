import * as text from "../../../../kit/text.js";
import { LenientMentionClaim } from "./lenient-mention-claim.js";

/** A rule a lenient mention claim must pass. Check returns its problems, or none. */
export interface LenientMentionClaimRule {
  check(item: LenientMentionClaim): string[];
}

export class LenientMentionClaimBatchSizeRangeRule implements LenientMentionClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientMentionClaim): string[] {
    const value = item.batchSize;
    if (value < this.min || value > this.max) return [`batch size ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientMentionClaimRateRangeRule implements LenientMentionClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientMentionClaim): string[] {
    const value = item.rate;
    if (value < this.min || value > this.max) return [`rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientMentionClaimCountryLengthRule implements LenientMentionClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientMentionClaim): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientMentionClaimUtmSourceLengthRule implements LenientMentionClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientMentionClaim): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientMentionClaimAllowedCodeRule implements LenientMentionClaimRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LenientMentionClaim): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is duplicated`];
    return [];
  }
}

/** Runs every rule of a lenient mention claim. */
export class LenientMentionClaimValidator {
  rules: LenientMentionClaimRule[];

  constructor(rules: LenientMentionClaimRule[]) {
    this.rules = rules;
  }

  validate(item: LenientMentionClaim): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientMentionClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientMentionClaim[]): Map<string, string[]> {
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

export function defaultLenientMentionClaimValidator(): LenientMentionClaimValidator {
  return new LenientMentionClaimValidator(
    [
      new LenientMentionClaimBatchSizeRangeRule(64, 64),
      new LenientMentionClaimRateRangeRule(6.3, 4415.8),
      new LenientMentionClaimCountryLengthRule(255),
      new LenientMentionClaimUtmSourceLengthRule(32),
      new LenientMentionClaimAllowedCodeRule([]),
    ],
  );
}
