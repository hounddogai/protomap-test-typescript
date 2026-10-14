import * as text from "../../../../kit/text.js";
import { FallbackReputationBatch } from "./fallback-reputation-batch.js";

/** A rule a fallback reputation batch must pass. Check returns its problems, or none. */
export interface FallbackReputationBatchRule {
  check(item: FallbackReputationBatch): string[];
}

export class FallbackReputationBatchCountryLengthRule implements FallbackReputationBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackReputationBatch): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackReputationBatchRetriesRangeRule implements FallbackReputationBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackReputationBatch): string[] {
    const value = item.retries;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`retries ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`retries ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FallbackReputationBatchAllowedCountryRule implements FallbackReputationBatchRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FallbackReputationBatch): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.country))) return [`country ${item.country} is blocked`];
    return [];
  }
}

export class FallbackReputationBatchCodePrefixRule implements FallbackReputationBatchRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FallbackReputationBatch): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FallbackReputationBatchRequiredCountryRule implements FallbackReputationBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackReputationBatch): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a fallback reputation batch. */
export class FallbackReputationBatchValidator {
  rules: FallbackReputationBatchRule[];

  constructor(rules: FallbackReputationBatchRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackReputationBatch): string[] {
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

  requireValid(item: FallbackReputationBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackReputationBatch[]): Map<string, string[]> {
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

export function defaultFallbackReputationBatchValidator(): FallbackReputationBatchValidator {
  return new FallbackReputationBatchValidator(
    [
      new FallbackReputationBatchCountryLengthRule(255),
      new FallbackReputationBatchRetriesRangeRule(1000, 86400),
      new FallbackReputationBatchAllowedCountryRule(["scheduled"]),
      new FallbackReputationBatchCodePrefixRule("OPS"),
      new FallbackReputationBatchRequiredCountryRule("fallback reputation batch needs a value"),
    ],
  );
}
