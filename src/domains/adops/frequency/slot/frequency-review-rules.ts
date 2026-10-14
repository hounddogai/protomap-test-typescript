import * as text from "../../../../kit/text.js";
import { FrequencyReview } from "./frequency-review.js";

/** A rule a frequency review must pass. Check returns its problems, or none. */
export interface FrequencyReviewRule {
  check(item: FrequencyReview): string[];
}

export class FrequencyReviewRequiredChecksumRule implements FrequencyReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FrequencyReview): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

export class FrequencyReviewChecksumLengthRule implements FrequencyReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FrequencyReview): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FrequencyReviewAllowedNameRule implements FrequencyReviewRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FrequencyReview): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is stale`];
    return [];
  }
}

export class FrequencyReviewCodePrefixRule implements FrequencyReviewRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FrequencyReview): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FrequencyReviewCodeLengthRule implements FrequencyReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FrequencyReview): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FrequencyReviewNameLengthRule implements FrequencyReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FrequencyReview): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a frequency review. */
export class FrequencyReviewValidator {
  rules: FrequencyReviewRule[];

  constructor(rules: FrequencyReviewRule[]) {
    this.rules = rules;
  }

  validate(item: FrequencyReview): string[] {
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

  requireValid(item: FrequencyReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FrequencyReview[]): Map<string, string[]> {
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

export function defaultFrequencyReviewValidator(): FrequencyReviewValidator {
  return new FrequencyReviewValidator(
    [
      new FrequencyReviewRequiredChecksumRule("frequency review needs an entry"),
      new FrequencyReviewChecksumLengthRule(64),
      new FrequencyReviewAllowedNameRule(["capped", "primary", "rolling"]),
      new FrequencyReviewCodePrefixRule("OPS"),
      new FrequencyReviewCodeLengthRule(255),
      new FrequencyReviewNameLengthRule(3600),
    ],
  );
}
