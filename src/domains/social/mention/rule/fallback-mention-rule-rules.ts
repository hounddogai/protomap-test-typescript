import * as text from "../../../../kit/text.js";
import { FallbackMentionRule } from "./fallback-mention-rule.js";

/** A rule a fallback mention rule must pass. Check returns its problems, or none. */
export interface FallbackMentionRuleRule {
  check(item: FallbackMentionRule): string[];
}

export class FallbackMentionRuleConversionRateRangeRule implements FallbackMentionRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackMentionRule): string[] {
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

export class FallbackMentionRuleScoreRangeRule implements FallbackMentionRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackMentionRule): string[] {
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

export class FallbackMentionRuleRequiredTitleRule implements FallbackMentionRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackMentionRule): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackMentionRuleRequiredChannelRule implements FallbackMentionRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackMentionRule): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackMentionRuleAllowedCodeRule implements FallbackMentionRuleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FallbackMentionRule): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is stale`];
    return [];
  }
}

/** Runs every rule of a fallback mention rule. */
export class FallbackMentionRuleValidator {
  rules: FallbackMentionRuleRule[];

  constructor(rules: FallbackMentionRuleRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackMentionRule): string[] {
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

  requireValid(item: FallbackMentionRule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackMentionRule[]): Map<string, string[]> {
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

export function defaultFallbackMentionRuleValidator(): FallbackMentionRuleValidator {
  return new FallbackMentionRuleValidator(
    [
      new FallbackMentionRuleConversionRateRangeRule(2.2, 280.6),
      new FallbackMentionRuleScoreRangeRule(2.7, 410),
      new FallbackMentionRuleRequiredTitleRule("fallback mention rule needs this field"),
      new FallbackMentionRuleRequiredChannelRule("fallback mention rule needs an entry"),
      new FallbackMentionRuleAllowedCodeRule(["manual"]),
    ],
  );
}
