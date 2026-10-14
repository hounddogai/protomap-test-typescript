import * as text from "../../../../kit/text.js";
import { FraudCheckRecord } from "./fraud-check-record.js";

/** A rule a fraud check record must pass. Check returns its problems, or none. */
export interface FraudCheckRecordRule {
  check(item: FraudCheckRecord): string[];
}

export class FraudCheckRecordCampaignRefLengthRule implements FraudCheckRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FraudCheckRecord): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FraudCheckRecordRequiredCampaignRefRule implements FraudCheckRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FraudCheckRecord): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class FraudCheckRecordAllowedCampaignRefRule implements FraudCheckRecordRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FraudCheckRecord): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.campaignRef))) return [`campaign ref ${item.campaignRef} is stale`];
    return [];
  }
}

export class FraudCheckRecordCodePrefixRule implements FraudCheckRecordRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FraudCheckRecord): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FraudCheckRecordOpenRateRangeRule implements FraudCheckRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FraudCheckRecord): string[] {
    const value = item.openRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`open rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`open rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a fraud check record. */
export class FraudCheckRecordValidator {
  rules: FraudCheckRecordRule[];

  constructor(rules: FraudCheckRecordRule[]) {
    this.rules = rules;
  }

  validate(item: FraudCheckRecord): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FraudCheckRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FraudCheckRecord[]): Map<string, string[]> {
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

export function defaultFraudCheckRecordValidator(): FraudCheckRecordValidator {
  return new FraudCheckRecordValidator(
    [
      new FraudCheckRecordCampaignRefLengthRule(86400),
      new FraudCheckRecordRequiredCampaignRefRule("fraud check record needs an entry"),
      new FraudCheckRecordAllowedCampaignRefRule(["tiered", "scheduled", "regional"]),
      new FraudCheckRecordCodePrefixRule("OPS"),
      new FraudCheckRecordOpenRateRangeRule(3.9, 1238.1),
    ],
  );
}
