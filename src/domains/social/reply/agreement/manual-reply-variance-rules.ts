import * as text from "../../../../kit/text.js";
import { ManualReplyVariance } from "./manual-reply-variance.js";

/** A rule a manual reply variance must pass. Check returns its problems, or none. */
export interface ManualReplyVarianceRule {
  check(item: ManualReplyVariance): string[];
}

export class ManualReplyVarianceLabelLengthRule implements ManualReplyVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualReplyVariance): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualReplyVarianceRequiredCodeRule implements ManualReplyVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualReplyVariance): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ManualReplyVarianceRequiredLabelRule implements ManualReplyVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualReplyVariance): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class ManualReplyVarianceEndsAtRangeRule implements ManualReplyVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualReplyVariance): string[] {
    const value = item.endsAt;
    if (value < this.min || value > this.max) return [`ends at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ManualReplyVarianceAllowedChannelRule implements ManualReplyVarianceRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ManualReplyVariance): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.channel))) return [`channel ${item.channel} is unknown`];
    return [];
  }
}

/** Runs every rule of a manual reply variance. */
export class ManualReplyVarianceValidator {
  rules: ManualReplyVarianceRule[];

  constructor(rules: ManualReplyVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: ManualReplyVariance): string[] {
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

  requireValid(item: ManualReplyVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualReplyVariance[]): Map<string, string[]> {
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

export function defaultManualReplyVarianceValidator(): ManualReplyVarianceValidator {
  return new ManualReplyVarianceValidator(
    [
      new ManualReplyVarianceLabelLengthRule(3600),
      new ManualReplyVarianceRequiredCodeRule("manual reply variance needs this field"),
      new ManualReplyVarianceRequiredLabelRule("manual reply variance needs a value"),
      new ManualReplyVarianceEndsAtRangeRule(16, 3600),
      new ManualReplyVarianceAllowedChannelRule([]),
    ],
  );
}
