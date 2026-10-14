import * as text from "../../../../kit/text.js";
import { ScheduledReplyOverride } from "./scheduled-reply-override.js";

/** A rule a scheduled reply override must pass. Check returns its problems, or none. */
export interface ScheduledReplyOverrideRule {
  check(item: ScheduledReplyOverride): string[];
}

export class ScheduledReplyOverrideAllowedCodeRule implements ScheduledReplyOverrideRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ScheduledReplyOverride): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is blocked`];
    return [];
  }
}

export class ScheduledReplyOverrideCampaignRefLengthRule implements ScheduledReplyOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledReplyOverride): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledReplyOverrideBudgetRangeRule implements ScheduledReplyOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledReplyOverride): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a scheduled reply override. */
export class ScheduledReplyOverrideValidator {
  rules: ScheduledReplyOverrideRule[];

  constructor(rules: ScheduledReplyOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledReplyOverride): string[] {
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

  requireValid(item: ScheduledReplyOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledReplyOverride[]): Map<string, string[]> {
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

export function defaultScheduledReplyOverrideValidator(): ScheduledReplyOverrideValidator {
  return new ScheduledReplyOverrideValidator(
    [
      new ScheduledReplyOverrideAllowedCodeRule(["lenient"]),
      new ScheduledReplyOverrideCampaignRefLengthRule(32),
      new ScheduledReplyOverrideBudgetRangeRule(3.9, 2055.8),
    ],
  );
}
