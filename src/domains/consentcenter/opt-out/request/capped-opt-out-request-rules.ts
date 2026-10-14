import * as text from "../../../../kit/text.js";
import { CappedOptOutRequest } from "./capped-opt-out-request.js";

/** A rule a capped opt out request must pass. Check returns its problems, or none. */
export interface CappedOptOutRequestRule {
  check(item: CappedOptOutRequest): string[];
}

export class CappedOptOutRequestLimitRangeRule implements CappedOptOutRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedOptOutRequest): string[] {
    const value = item.limit;
    if (value < this.min || value > this.max) return [`limit ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CappedOptOutRequestAllowedCampaignRefRule implements CappedOptOutRequestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CappedOptOutRequest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.campaignRef))) return [`campaign ref ${item.campaignRef} is expired`];
    return [];
  }
}

export class CappedOptOutRequestCodeLengthRule implements CappedOptOutRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedOptOutRequest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedOptOutRequestTitleLengthRule implements CappedOptOutRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedOptOutRequest): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a capped opt out request. */
export class CappedOptOutRequestValidator {
  rules: CappedOptOutRequestRule[];

  constructor(rules: CappedOptOutRequestRule[]) {
    this.rules = rules;
  }

  validate(item: CappedOptOutRequest): string[] {
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

  requireValid(item: CappedOptOutRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedOptOutRequest[]): Map<string, string[]> {
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

export function defaultCappedOptOutRequestValidator(): CappedOptOutRequestValidator {
  return new CappedOptOutRequestValidator(
    [
      new CappedOptOutRequestLimitRangeRule(16, 255),
      new CappedOptOutRequestAllowedCampaignRefRule(["seasonal", "pending", "regional"]),
      new CappedOptOutRequestCodeLengthRule(120),
      new CappedOptOutRequestTitleLengthRule(120),
    ],
  );
}
