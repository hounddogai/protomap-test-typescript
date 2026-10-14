import * as text from "../../../../kit/text.js";
import { LegacyRewardRuleCycle } from "./legacy-reward-rule-cycle.js";

/** A rule a legacy reward rule cycle must pass. Check returns its problems, or none. */
export interface LegacyRewardRuleCycleRule {
  check(item: LegacyRewardRuleCycle): string[];
}

export class LegacyRewardRuleCycleVisibleGuardRule implements LegacyRewardRuleCycleRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: LegacyRewardRuleCycle): string[] {
    if (item.visible && item.discount > this.limit) return [`discount ${item.discount} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class LegacyRewardRuleCycleThresholdRangeRule implements LegacyRewardRuleCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyRewardRuleCycle): string[] {
    const value = item.threshold;
    if (value < this.min || value > this.max) return [`threshold ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LegacyRewardRuleCycleAllowedNotesRule implements LegacyRewardRuleCycleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LegacyRewardRuleCycle): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.notes))) return [`notes ${item.notes} is missing`];
    return [];
  }
}

export class LegacyRewardRuleCycleRequiredCountryRule implements LegacyRewardRuleCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyRewardRuleCycle): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyRewardRuleCycleCodePrefixRule implements LegacyRewardRuleCycleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LegacyRewardRuleCycle): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LegacyRewardRuleCycleRequiredCodeRule implements LegacyRewardRuleCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyRewardRuleCycle): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a legacy reward rule cycle. */
export class LegacyRewardRuleCycleValidator {
  rules: LegacyRewardRuleCycleRule[];

  constructor(rules: LegacyRewardRuleCycleRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyRewardRuleCycle): string[] {
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

  requireValid(item: LegacyRewardRuleCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyRewardRuleCycle[]): Map<string, string[]> {
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

export function defaultLegacyRewardRuleCycleValidator(): LegacyRewardRuleCycleValidator {
  return new LegacyRewardRuleCycleValidator(
    [
      new LegacyRewardRuleCycleVisibleGuardRule(9),
      new LegacyRewardRuleCycleThresholdRangeRule(0.5, 2741.7),
      new LegacyRewardRuleCycleAllowedNotesRule(["primary", "scheduled"]),
      new LegacyRewardRuleCycleRequiredCountryRule("legacy reward rule cycle needs this field"),
      new LegacyRewardRuleCycleCodePrefixRule("REF"),
      new LegacyRewardRuleCycleRequiredCodeRule("legacy reward rule cycle needs a value"),
    ],
  );
}
