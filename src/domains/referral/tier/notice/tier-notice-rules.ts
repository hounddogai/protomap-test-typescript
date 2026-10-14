import { TierNotice } from "./tier-notice.js";

/** A rule a tier notice must pass. Check returns its problems, or none. */
export interface TierNoticeRule {
  check(item: TierNotice): string[];
}

export class TierNoticeMaximumRangeRule implements TierNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TierNotice): string[] {
    const value = item.maximum;
    if (value < this.min || value > this.max) return [`maximum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TierNoticeChecksumLengthRule implements TierNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TierNotice): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TierNoticeLabelLengthRule implements TierNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TierNotice): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TierNoticeCostRangeRule implements TierNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TierNotice): string[] {
    const value = item.cost;
    if (value < this.min || value > this.max) return [`cost ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TierNoticeCodePrefixRule implements TierNoticeRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TierNotice): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class TierNoticeRequiredLabelRule implements TierNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TierNotice): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a tier notice. */
export class TierNoticeValidator {
  rules: TierNoticeRule[];

  constructor(rules: TierNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: TierNotice): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TierNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TierNotice[]): Map<string, string[]> {
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

export function defaultTierNoticeValidator(): TierNoticeValidator {
  return new TierNoticeValidator(
    [
      new TierNoticeMaximumRangeRule(4.8, 2557.7),
      new TierNoticeChecksumLengthRule(16),
      new TierNoticeLabelLengthRule(120),
      new TierNoticeCostRangeRule(6.4, 3438.2),
      new TierNoticeCodePrefixRule("ACM"),
      new TierNoticeRequiredLabelRule("tier notice needs an entry"),
    ],
  );
}
