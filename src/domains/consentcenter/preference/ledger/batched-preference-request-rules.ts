import * as text from "../../../../kit/text.js";
import { BatchedPreferenceRequest } from "./batched-preference-request.js";

/** A rule a batched preference request must pass. Check returns its problems, or none. */
export interface BatchedPreferenceRequestRule {
  check(item: BatchedPreferenceRequest): string[];
}

export class BatchedPreferenceRequestAllowedCodeRule implements BatchedPreferenceRequestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BatchedPreferenceRequest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is unknown`];
    return [];
  }
}

export class BatchedPreferenceRequestRateRangeRule implements BatchedPreferenceRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedPreferenceRequest): string[] {
    const value = item.rate;
    if (value < this.min || value > this.max) return [`rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BatchedPreferenceRequestRequiredLocaleRule implements BatchedPreferenceRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedPreferenceRequest): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedPreferenceRequestCodeLengthRule implements BatchedPreferenceRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedPreferenceRequest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedPreferenceRequestMinimumRangeRule implements BatchedPreferenceRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedPreferenceRequest): string[] {
    const value = item.minimum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`minimum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`minimum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BatchedPreferenceRequestRequiredLabelRule implements BatchedPreferenceRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedPreferenceRequest): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a batched preference request. */
export class BatchedPreferenceRequestValidator {
  rules: BatchedPreferenceRequestRule[];

  constructor(rules: BatchedPreferenceRequestRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedPreferenceRequest): string[] {
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

  requireValid(item: BatchedPreferenceRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedPreferenceRequest[]): Map<string, string[]> {
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

export function defaultBatchedPreferenceRequestValidator(): BatchedPreferenceRequestValidator {
  return new BatchedPreferenceRequestValidator(
    [
      new BatchedPreferenceRequestAllowedCodeRule([]),
      new BatchedPreferenceRequestRateRangeRule(3, 1090.6),
      new BatchedPreferenceRequestRequiredLocaleRule("batched preference request needs an entry"),
      new BatchedPreferenceRequestCodeLengthRule(255),
      new BatchedPreferenceRequestMinimumRangeRule(1.3, 2382.7),
      new BatchedPreferenceRequestRequiredLabelRule("batched preference request needs a value"),
    ],
  );
}
