import * as text from "../../../../kit/text.js";
import { MentionThreshold } from "./mention-threshold.js";

/** A rule a mention threshold must pass. Check returns its problems, or none. */
export interface MentionThresholdRule {
  check(item: MentionThreshold): string[];
}

export class MentionThresholdConversionRateRangeRule implements MentionThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: MentionThreshold): string[] {
    const value = item.conversionRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`conversion rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`conversion rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class MentionThresholdRequiredChannelRule implements MentionThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: MentionThreshold): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class MentionThresholdAllowedTimezoneRule implements MentionThresholdRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: MentionThreshold): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.timezone))) return [`timezone ${item.timezone} is blocked`];
    return [];
  }
}

export class MentionThresholdCodeLengthRule implements MentionThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MentionThreshold): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a mention threshold. */
export class MentionThresholdValidator {
  rules: MentionThresholdRule[];

  constructor(rules: MentionThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: MentionThreshold): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: MentionThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: MentionThreshold[]): Map<string, string[]> {
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

export function defaultMentionThresholdValidator(): MentionThresholdValidator {
  return new MentionThresholdValidator(
    [
      new MentionThresholdConversionRateRangeRule(4.3, 3767.7),
      new MentionThresholdRequiredChannelRule("mention threshold needs this field"),
      new MentionThresholdAllowedTimezoneRule(["batched", "global"]),
      new MentionThresholdCodeLengthRule(32),
    ],
  );
}
