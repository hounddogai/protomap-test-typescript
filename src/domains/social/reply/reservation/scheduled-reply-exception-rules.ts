import * as text from "../../../../kit/text.js";
import { ScheduledReplyException } from "./scheduled-reply-exception.js";

/** A rule a scheduled reply exception must pass. Check returns its problems, or none. */
export interface ScheduledReplyExceptionRule {
  check(item: ScheduledReplyException): string[];
}

export class ScheduledReplyExceptionRequiredNameRule implements ScheduledReplyExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledReplyException): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledReplyExceptionRequiredCodeRule implements ScheduledReplyExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledReplyException): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledReplyExceptionAllowedCampaignRefRule implements ScheduledReplyExceptionRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ScheduledReplyException): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.campaignRef))) return [`campaign ref ${item.campaignRef} is out of range`];
    return [];
  }
}

export class ScheduledReplyExceptionRequiredPhoneRule implements ScheduledReplyExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledReplyException): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledReplyExceptionCodePrefixRule implements ScheduledReplyExceptionRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ScheduledReplyException): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ScheduledReplyExceptionRateRangeRule implements ScheduledReplyExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledReplyException): string[] {
    const value = item.rate;
    if (value < this.min || value > this.max) return [`rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a scheduled reply exception. */
export class ScheduledReplyExceptionValidator {
  rules: ScheduledReplyExceptionRule[];

  constructor(rules: ScheduledReplyExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledReplyException): string[] {
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

  requireValid(item: ScheduledReplyException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledReplyException[]): Map<string, string[]> {
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

export function defaultScheduledReplyExceptionValidator(): ScheduledReplyExceptionValidator {
  return new ScheduledReplyExceptionValidator(
    [
      new ScheduledReplyExceptionRequiredNameRule("scheduled reply exception needs a value"),
      new ScheduledReplyExceptionRequiredCodeRule("scheduled reply exception needs a value"),
      new ScheduledReplyExceptionAllowedCampaignRefRule(["seasonal"]),
      new ScheduledReplyExceptionRequiredPhoneRule("scheduled reply exception needs an entry"),
      new ScheduledReplyExceptionCodePrefixRule("Q"),
      new ScheduledReplyExceptionRateRangeRule(9.7, 4814.6),
    ],
  );
}
