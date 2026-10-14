import * as text from "../../../../kit/text.js";
import { ScheduledRetentionScore } from "./scheduled-retention-score.js";

/** A rule a scheduled retention score must pass. Check returns its problems, or none. */
export interface ScheduledRetentionScoreRule {
  check(item: ScheduledRetentionScore): string[];
}

export class ScheduledRetentionScoreLabelLengthRule implements ScheduledRetentionScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledRetentionScore): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledRetentionScoreAllowedCampaignRefRule implements ScheduledRetentionScoreRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ScheduledRetentionScore): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.campaignRef))) return [`campaign ref ${item.campaignRef} is below minimum`];
    return [];
  }
}

export class ScheduledRetentionScoreRequiredCodeRule implements ScheduledRetentionScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledRetentionScore): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledRetentionScoreScoreRangeRule implements ScheduledRetentionScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledRetentionScore): string[] {
    const value = item.score;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`score ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`score ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ScheduledRetentionScoreCodePrefixRule implements ScheduledRetentionScoreRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ScheduledRetentionScore): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a scheduled retention score. */
export class ScheduledRetentionScoreValidator {
  rules: ScheduledRetentionScoreRule[];

  constructor(rules: ScheduledRetentionScoreRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledRetentionScore): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ScheduledRetentionScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledRetentionScore[]): Map<string, string[]> {
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

export function defaultScheduledRetentionScoreValidator(): ScheduledRetentionScoreValidator {
  return new ScheduledRetentionScoreValidator(
    [
      new ScheduledRetentionScoreLabelLengthRule(32),
      new ScheduledRetentionScoreAllowedCampaignRefRule(["tiered", "batched", "fallback"]),
      new ScheduledRetentionScoreRequiredCodeRule("scheduled retention score needs this field"),
      new ScheduledRetentionScoreScoreRangeRule(7, 592.4),
      new ScheduledRetentionScoreCodePrefixRule("OPS"),
    ],
  );
}
