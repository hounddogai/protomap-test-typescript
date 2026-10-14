import { LegacyBadgeNotice } from "./legacy-badge-notice.js";

/** A rule a legacy badge notice must pass. Check returns its problems, or none. */
export interface LegacyBadgeNoticeRule {
  check(item: LegacyBadgeNotice): string[];
}

export class LegacyBadgeNoticeCodeLengthRule implements LegacyBadgeNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyBadgeNotice): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyBadgeNoticeCodePrefixRule implements LegacyBadgeNoticeRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LegacyBadgeNotice): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LegacyBadgeNoticeLabelLengthRule implements LegacyBadgeNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyBadgeNotice): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyBadgeNoticeRequiredCodeRule implements LegacyBadgeNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyBadgeNotice): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyBadgeNoticeRequiredTimezoneRule implements LegacyBadgeNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyBadgeNotice): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyBadgeNoticeEndsAtRangeRule implements LegacyBadgeNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyBadgeNotice): string[] {
    const value = item.endsAt;
    if (value < this.min || value > this.max) return [`ends at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a legacy badge notice. */
export class LegacyBadgeNoticeValidator {
  rules: LegacyBadgeNoticeRule[];

  constructor(rules: LegacyBadgeNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyBadgeNotice): string[] {
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

  requireValid(item: LegacyBadgeNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyBadgeNotice[]): Map<string, string[]> {
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

export function defaultLegacyBadgeNoticeValidator(): LegacyBadgeNoticeValidator {
  return new LegacyBadgeNoticeValidator(
    [
      new LegacyBadgeNoticeCodeLengthRule(120),
      new LegacyBadgeNoticeCodePrefixRule("ACM"),
      new LegacyBadgeNoticeLabelLengthRule(120),
      new LegacyBadgeNoticeRequiredCodeRule("legacy badge notice needs this field"),
      new LegacyBadgeNoticeRequiredTimezoneRule("legacy badge notice needs a value"),
      new LegacyBadgeNoticeEndsAtRangeRule(32, 1000),
    ],
  );
}
