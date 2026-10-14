import { TieredStepNotice } from "./tiered-step-notice.js";

/** A rule a tiered step notice must pass. Check returns its problems, or none. */
export interface TieredStepNoticeRule {
  check(item: TieredStepNotice): string[];
}

export class TieredStepNoticeVariantLengthRule implements TieredStepNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredStepNotice): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredStepNoticeCostRangeRule implements TieredStepNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredStepNotice): string[] {
    const value = item.cost;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`cost ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`cost ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TieredStepNoticeDiscountRangeRule implements TieredStepNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredStepNotice): string[] {
    const value = item.discount;
    if (value < this.min || value > this.max) return [`discount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredStepNoticeRequiredCodeRule implements TieredStepNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredStepNotice): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a tiered step notice. */
export class TieredStepNoticeValidator {
  rules: TieredStepNoticeRule[];

  constructor(rules: TieredStepNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: TieredStepNotice): string[] {
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

  requireValid(item: TieredStepNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredStepNotice[]): Map<string, string[]> {
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

export function defaultTieredStepNoticeValidator(): TieredStepNoticeValidator {
  return new TieredStepNoticeValidator(
    [
      new TieredStepNoticeVariantLengthRule(1000),
      new TieredStepNoticeCostRangeRule(4.7, 1979.6),
      new TieredStepNoticeDiscountRangeRule(7.6, 2936.6),
      new TieredStepNoticeRequiredCodeRule("tiered step notice needs this field"),
    ],
  );
}
