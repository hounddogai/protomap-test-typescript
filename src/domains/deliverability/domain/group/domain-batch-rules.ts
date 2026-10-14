import { DomainBatch } from "./domain-batch.js";

/** A rule a domain batch must pass. Check returns its problems, or none. */
export interface DomainBatchRule {
  check(item: DomainBatch): string[];
}

export class DomainBatchCodeLengthRule implements DomainBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DomainBatch): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DomainBatchUpdatedAtRangeRule implements DomainBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DomainBatch): string[] {
    const value = item.updatedAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`updated at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`updated at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DomainBatchSendAtRangeRule implements DomainBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DomainBatch): string[] {
    const value = item.sendAt;
    if (value < this.min || value > this.max) return [`send at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DomainBatchRequiredCampaignRefRule implements DomainBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DomainBatch): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class DomainBatchCampaignRefLengthRule implements DomainBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DomainBatch): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DomainBatchOpenRateRangeRule implements DomainBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DomainBatch): string[] {
    const value = item.openRate;
    if (value < this.min || value > this.max) return [`open rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a domain batch. */
export class DomainBatchValidator {
  rules: DomainBatchRule[];

  constructor(rules: DomainBatchRule[]) {
    this.rules = rules;
  }

  validate(item: DomainBatch): string[] {
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

  requireValid(item: DomainBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DomainBatch[]): Map<string, string[]> {
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

export function defaultDomainBatchValidator(): DomainBatchValidator {
  return new DomainBatchValidator(
    [
      new DomainBatchCodeLengthRule(32),
      new DomainBatchUpdatedAtRangeRule(64, 80),
      new DomainBatchSendAtRangeRule(255, 3600),
      new DomainBatchRequiredCampaignRefRule("domain batch needs this field"),
      new DomainBatchCampaignRefLengthRule(3600),
      new DomainBatchOpenRateRangeRule(8.2, 2289.5),
    ],
  );
}
