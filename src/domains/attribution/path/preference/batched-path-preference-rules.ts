import * as text from "../../../../kit/text.js";
import { BatchedPathPreference } from "./batched-path-preference.js";

/** A rule a batched path preference must pass. Check returns its problems, or none. */
export interface BatchedPathPreferenceRule {
  check(item: BatchedPathPreference): string[];
}

export class BatchedPathPreferenceSegmentLengthRule implements BatchedPathPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedPathPreference): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedPathPreferenceRequiredPhoneRule implements BatchedPathPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedPathPreference): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedPathPreferencePhoneLengthRule implements BatchedPathPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedPathPreference): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedPathPreferenceCodePrefixRule implements BatchedPathPreferenceRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BatchedPathPreference): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BatchedPathPreferenceAllowedPhoneRule implements BatchedPathPreferenceRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BatchedPathPreference): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.phone))) return [`phone ${item.phone} is inconsistent`];
    return [];
  }
}

/** Runs every rule of a batched path preference. */
export class BatchedPathPreferenceValidator {
  rules: BatchedPathPreferenceRule[];

  constructor(rules: BatchedPathPreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedPathPreference): string[] {
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

  requireValid(item: BatchedPathPreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedPathPreference[]): Map<string, string[]> {
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

export function defaultBatchedPathPreferenceValidator(): BatchedPathPreferenceValidator {
  return new BatchedPathPreferenceValidator(
    [
      new BatchedPathPreferenceSegmentLengthRule(64),
      new BatchedPathPreferenceRequiredPhoneRule("batched path preference needs an entry"),
      new BatchedPathPreferencePhoneLengthRule(255),
      new BatchedPathPreferenceCodePrefixRule("Q"),
      new BatchedPathPreferenceAllowedPhoneRule(["strict", "pending", "rolling"]),
    ],
  );
}
