import * as text from "../../../../kit/text.js";
import { ScheduledFrequencyNotice } from "./scheduled-frequency-notice.js";

/** A rule a scheduled frequency notice must pass. Check returns its problems, or none. */
export interface ScheduledFrequencyNoticeRule {
  check(item: ScheduledFrequencyNotice): string[];
}

export class ScheduledFrequencyNoticeAllowedNotesRule implements ScheduledFrequencyNoticeRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ScheduledFrequencyNotice): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.notes))) return [`notes ${item.notes} is too long`];
    return [];
  }
}

export class ScheduledFrequencyNoticeCodePrefixRule implements ScheduledFrequencyNoticeRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ScheduledFrequencyNotice): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ScheduledFrequencyNoticeRequiredLabelRule implements ScheduledFrequencyNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledFrequencyNotice): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledFrequencyNoticeCodeLengthRule implements ScheduledFrequencyNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledFrequencyNotice): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledFrequencyNoticeSourceLengthRule implements ScheduledFrequencyNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledFrequencyNotice): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledFrequencyNoticeExpiresAtRangeRule implements ScheduledFrequencyNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledFrequencyNotice): string[] {
    const value = item.expiresAt;
    if (value < this.min || value > this.max) return [`expires at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a scheduled frequency notice. */
export class ScheduledFrequencyNoticeValidator {
  rules: ScheduledFrequencyNoticeRule[];

  constructor(rules: ScheduledFrequencyNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledFrequencyNotice): string[] {
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

  requireValid(item: ScheduledFrequencyNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledFrequencyNotice[]): Map<string, string[]> {
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

export function defaultScheduledFrequencyNoticeValidator(): ScheduledFrequencyNoticeValidator {
  return new ScheduledFrequencyNoticeValidator(
    [
      new ScheduledFrequencyNoticeAllowedNotesRule([]),
      new ScheduledFrequencyNoticeCodePrefixRule("OPS"),
      new ScheduledFrequencyNoticeRequiredLabelRule("scheduled frequency notice needs this field"),
      new ScheduledFrequencyNoticeCodeLengthRule(255),
      new ScheduledFrequencyNoticeSourceLengthRule(255),
      new ScheduledFrequencyNoticeExpiresAtRangeRule(64, 1000),
    ],
  );
}
