import { TieredConversionNotice } from "./tiered-conversion-notice.js";

/** A rule a tiered conversion notice must pass. Check returns its problems, or none. */
export interface TieredConversionNoticeRule {
  check(item: TieredConversionNotice): string[];
}

export class TieredConversionNoticeRequiredLabelRule implements TieredConversionNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredConversionNotice): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class TieredConversionNoticeCostRangeRule implements TieredConversionNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredConversionNotice): string[] {
    const value = item.cost;
    if (value < this.min || value > this.max) return [`cost ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredConversionNoticeDiscountRangeRule implements TieredConversionNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredConversionNotice): string[] {
    const value = item.discount;
    if (value < this.min || value > this.max) return [`discount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredConversionNoticeRequiredReviewerRule implements TieredConversionNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredConversionNotice): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class TieredConversionNoticeRequiredCampaignRefRule implements TieredConversionNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredConversionNotice): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class TieredConversionNoticeReviewerLengthRule implements TieredConversionNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredConversionNotice): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a tiered conversion notice. */
export class TieredConversionNoticeValidator {
  rules: TieredConversionNoticeRule[];

  constructor(rules: TieredConversionNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: TieredConversionNotice): string[] {
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

  requireValid(item: TieredConversionNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredConversionNotice[]): Map<string, string[]> {
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

export function defaultTieredConversionNoticeValidator(): TieredConversionNoticeValidator {
  return new TieredConversionNoticeValidator(
    [
      new TieredConversionNoticeRequiredLabelRule("tiered conversion notice needs a value"),
      new TieredConversionNoticeCostRangeRule(2.3, 3068.7),
      new TieredConversionNoticeDiscountRangeRule(2.8, 3502.6),
      new TieredConversionNoticeRequiredReviewerRule("tiered conversion notice needs this field"),
      new TieredConversionNoticeRequiredCampaignRefRule("tiered conversion notice needs an entry"),
      new TieredConversionNoticeReviewerLengthRule(86400),
    ],
  );
}
