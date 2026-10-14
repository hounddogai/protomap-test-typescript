import * as text from "../../../../kit/text.js";
import { ManualReplyException } from "./manual-reply-exception.js";

/** A rule a manual reply exception must pass. Check returns its problems, or none. */
export interface ManualReplyExceptionRule {
  check(item: ManualReplyException): string[];
}

export class ManualReplyExceptionCampaignRefLengthRule implements ManualReplyExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualReplyException): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualReplyExceptionRequiredCodeRule implements ManualReplyExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualReplyException): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ManualReplyExceptionFrequencyCapRangeRule implements ManualReplyExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualReplyException): string[] {
    const value = item.frequencyCap;
    if (value < this.min || value > this.max) return [`frequency cap ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ManualReplyExceptionAllowedCampaignRefRule implements ManualReplyExceptionRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ManualReplyException): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.campaignRef))) return [`campaign ref ${item.campaignRef} is above maximum`];
    return [];
  }
}

/** Runs every rule of a manual reply exception. */
export class ManualReplyExceptionValidator {
  rules: ManualReplyExceptionRule[];

  constructor(rules: ManualReplyExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: ManualReplyException): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualReplyException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualReplyException[]): Map<string, string[]> {
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

export function defaultManualReplyExceptionValidator(): ManualReplyExceptionValidator {
  return new ManualReplyExceptionValidator(
    [
      new ManualReplyExceptionCampaignRefLengthRule(120),
      new ManualReplyExceptionRequiredCodeRule("manual reply exception needs this field"),
      new ManualReplyExceptionFrequencyCapRangeRule(255, 255),
      new ManualReplyExceptionAllowedCampaignRefRule([]),
    ],
  );
}
