import { RetentionLedger } from "./retention-ledger.js";

/** A rule a retention ledger must pass. Check returns its problems, or none. */
export interface RetentionLedgerRule {
  check(item: RetentionLedger): string[];
}

export class RetentionLedgerNameLengthRule implements RetentionLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RetentionLedger): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RetentionLedgerConversionRateRangeRule implements RetentionLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RetentionLedger): string[] {
    const value = item.conversionRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`conversion rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`conversion rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RetentionLedgerCampaignRefLengthRule implements RetentionLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RetentionLedger): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RetentionLedgerSegmentLengthRule implements RetentionLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RetentionLedger): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RetentionLedgerRequiredCampaignRefRule implements RetentionLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RetentionLedger): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a retention ledger. */
export class RetentionLedgerValidator {
  rules: RetentionLedgerRule[];

  constructor(rules: RetentionLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: RetentionLedger): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RetentionLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RetentionLedger[]): Map<string, string[]> {
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

export function defaultRetentionLedgerValidator(): RetentionLedgerValidator {
  return new RetentionLedgerValidator(
    [
      new RetentionLedgerNameLengthRule(1000),
      new RetentionLedgerConversionRateRangeRule(4.7, 405.2),
      new RetentionLedgerCampaignRefLengthRule(16),
      new RetentionLedgerSegmentLengthRule(64),
      new RetentionLedgerRequiredCampaignRefRule("retention ledger needs an entry"),
    ],
  );
}
