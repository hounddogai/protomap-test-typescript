import * as text from "../../../../kit/text.js";
import { ApprovalRecord } from "./approval-record.js";

/** A rule a approval record must pass. Check returns its problems, or none. */
export interface ApprovalRecordRule {
  check(item: ApprovalRecord): string[];
}

export class ApprovalRecordAmountRangeRule implements ApprovalRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ApprovalRecord): string[] {
    const value = item.amount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`amount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`amount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ApprovalRecordTitleLengthRule implements ApprovalRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ApprovalRecord): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ApprovalRecordWeightRangeRule implements ApprovalRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ApprovalRecord): string[] {
    const value = item.weight;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`weight ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`weight ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ApprovalRecordCampaignRefLengthRule implements ApprovalRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ApprovalRecord): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ApprovalRecordAllowedNameRule implements ApprovalRecordRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ApprovalRecord): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is unknown`];
    return [];
  }
}

/** Runs every rule of a approval record. */
export class ApprovalRecordValidator {
  rules: ApprovalRecordRule[];

  constructor(rules: ApprovalRecordRule[]) {
    this.rules = rules;
  }

  validate(item: ApprovalRecord): string[] {
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

  requireValid(item: ApprovalRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ApprovalRecord[]): Map<string, string[]> {
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

export function defaultApprovalRecordValidator(): ApprovalRecordValidator {
  return new ApprovalRecordValidator(
    [
      new ApprovalRecordAmountRangeRule(2.3, 2398),
      new ApprovalRecordTitleLengthRule(16),
      new ApprovalRecordWeightRangeRule(0, 4617.9),
      new ApprovalRecordCampaignRefLengthRule(3600),
      new ApprovalRecordAllowedNameRule([]),
    ],
  );
}
