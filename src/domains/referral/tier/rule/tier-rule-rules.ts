import * as text from "../../../../kit/text.js";
import { TierRule } from "./tier-rule.js";

/** A rule a tier rule must pass. Check returns its problems, or none. */
export interface TierRuleRule {
  check(item: TierRule): string[];
}

export class TierRuleRequiredChannelRule implements TierRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TierRule): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class TierRuleAllowedCodeRule implements TierRuleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TierRule): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is below minimum`];
    return [];
  }
}

export class TierRuleChannelLengthRule implements TierRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TierRule): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TierRuleActiveGuardRule implements TierRuleRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: TierRule): string[] {
    if (item.active && item.updatedAt > this.limit) return [`updated at ${item.updatedAt} exceeds ${this.limit} while active`];
    return [];
  }
}

export class TierRuleTagsLimitRule implements TierRuleRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: TierRule): string[] {
    const problems: string[] = [];
    if (item.tags.length > this.maxCount) {
      problems.push(`has ${item.tags.length} tags, at most ${this.maxCount} allowed`);
    }
    for (const tag of item.tags) {
      if (this.banned.includes(tag)) {
        problems.push(`tag ${tag} is not allowed`);
      }
    }
    return problems;
  }
}

export class TierRuleFrequencyCapRangeRule implements TierRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TierRule): string[] {
    const value = item.frequencyCap;
    if (value < this.min || value > this.max) return [`frequency cap ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a tier rule. */
export class TierRuleValidator {
  rules: TierRuleRule[];

  constructor(rules: TierRuleRule[]) {
    this.rules = rules;
  }

  validate(item: TierRule): string[] {
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

  requireValid(item: TierRule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TierRule[]): Map<string, string[]> {
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

export function defaultTierRuleValidator(): TierRuleValidator {
  return new TierRuleValidator(
    [
      new TierRuleRequiredChannelRule("tier rule needs a value"),
      new TierRuleAllowedCodeRule(["primary", "default", "manual"]),
      new TierRuleChannelLengthRule(255),
      new TierRuleActiveGuardRule(255),
      new TierRuleTagsLimitRule(1000, []),
      new TierRuleFrequencyCapRangeRule(64, 255),
    ],
  );
}
