import * as text from "../../../../kit/text.js";
import { TieredRedemptionBatch } from "./tiered-redemption-batch.js";

/** A rule a tiered redemption batch must pass. Check returns its problems, or none. */
export interface TieredRedemptionBatchRule {
  check(item: TieredRedemptionBatch): string[];
}

export class TieredRedemptionBatchMarginRangeRule implements TieredRedemptionBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredRedemptionBatch): string[] {
    const value = item.margin;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`margin ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`margin ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TieredRedemptionBatchChecksumLengthRule implements TieredRedemptionBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredRedemptionBatch): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredRedemptionBatchAllowedChannelRule implements TieredRedemptionBatchRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TieredRedemptionBatch): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.channel))) return [`channel ${item.channel} is missing`];
    return [];
  }
}

export class TieredRedemptionBatchCodePrefixRule implements TieredRedemptionBatchRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TieredRedemptionBatch): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a tiered redemption batch. */
export class TieredRedemptionBatchValidator {
  rules: TieredRedemptionBatchRule[];

  constructor(rules: TieredRedemptionBatchRule[]) {
    this.rules = rules;
  }

  validate(item: TieredRedemptionBatch): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredRedemptionBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredRedemptionBatch[]): Map<string, string[]> {
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

export function defaultTieredRedemptionBatchValidator(): TieredRedemptionBatchValidator {
  return new TieredRedemptionBatchValidator(
    [
      new TieredRedemptionBatchMarginRangeRule(8.7, 2796),
      new TieredRedemptionBatchChecksumLengthRule(16),
      new TieredRedemptionBatchAllowedChannelRule(["batched"]),
      new TieredRedemptionBatchCodePrefixRule("Q"),
    ],
  );
}
