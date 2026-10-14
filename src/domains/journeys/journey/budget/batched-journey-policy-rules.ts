import * as text from "../../../../kit/text.js";
import { BatchedJourneyPolicy } from "./batched-journey-policy.js";

/** A rule a batched journey policy must pass. Check returns its problems, or none. */
export interface BatchedJourneyPolicyRule {
  check(item: BatchedJourneyPolicy): string[];
}

export class BatchedJourneyPolicyRateRangeRule implements BatchedJourneyPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedJourneyPolicy): string[] {
    const value = item.rate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BatchedJourneyPolicyRequiredChannelRule implements BatchedJourneyPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedJourneyPolicy): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedJourneyPolicyCodeLengthRule implements BatchedJourneyPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedJourneyPolicy): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedJourneyPolicyAllowedCodeRule implements BatchedJourneyPolicyRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BatchedJourneyPolicy): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is stale`];
    return [];
  }
}

export class BatchedJourneyPolicyPinnedGuardRule implements BatchedJourneyPolicyRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: BatchedJourneyPolicy): string[] {
    if (item.pinned && item.batchSize > this.limit) return [`batch size ${item.batchSize} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class BatchedJourneyPolicyCodePrefixRule implements BatchedJourneyPolicyRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BatchedJourneyPolicy): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a batched journey policy. */
export class BatchedJourneyPolicyValidator {
  rules: BatchedJourneyPolicyRule[];

  constructor(rules: BatchedJourneyPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedJourneyPolicy): string[] {
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

  requireValid(item: BatchedJourneyPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedJourneyPolicy[]): Map<string, string[]> {
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

export function defaultBatchedJourneyPolicyValidator(): BatchedJourneyPolicyValidator {
  return new BatchedJourneyPolicyValidator(
    [
      new BatchedJourneyPolicyRateRangeRule(8.9, 1754),
      new BatchedJourneyPolicyRequiredChannelRule("batched journey policy needs this field"),
      new BatchedJourneyPolicyCodeLengthRule(32),
      new BatchedJourneyPolicyAllowedCodeRule([]),
      new BatchedJourneyPolicyPinnedGuardRule(3600),
      new BatchedJourneyPolicyCodePrefixRule("X"),
    ],
  );
}
