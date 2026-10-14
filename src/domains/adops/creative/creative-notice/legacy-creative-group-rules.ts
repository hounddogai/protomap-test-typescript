import * as text from "../../../../kit/text.js";
import { LegacyCreativeGroup } from "./legacy-creative-group.js";

/** A rule a legacy creative group must pass. Check returns its problems, or none. */
export interface LegacyCreativeGroupRule {
  check(item: LegacyCreativeGroup): string[];
}

export class LegacyCreativeGroupBudgetRangeRule implements LegacyCreativeGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyCreativeGroup): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LegacyCreativeGroupRequiredLocaleRule implements LegacyCreativeGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyCreativeGroup): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyCreativeGroupLocaleLengthRule implements LegacyCreativeGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyCreativeGroup): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyCreativeGroupCodePrefixRule implements LegacyCreativeGroupRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LegacyCreativeGroup): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LegacyCreativeGroupAllowedLocaleRule implements LegacyCreativeGroupRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LegacyCreativeGroup): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.locale))) return [`locale ${item.locale} is stale`];
    return [];
  }
}

export class LegacyCreativeGroupRequiredChannelRule implements LegacyCreativeGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyCreativeGroup): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a legacy creative group. */
export class LegacyCreativeGroupValidator {
  rules: LegacyCreativeGroupRule[];

  constructor(rules: LegacyCreativeGroupRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyCreativeGroup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacyCreativeGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyCreativeGroup[]): Map<string, string[]> {
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

export function defaultLegacyCreativeGroupValidator(): LegacyCreativeGroupValidator {
  return new LegacyCreativeGroupValidator(
    [
      new LegacyCreativeGroupBudgetRangeRule(3.1, 1980.1),
      new LegacyCreativeGroupRequiredLocaleRule("legacy creative group needs this field"),
      new LegacyCreativeGroupLocaleLengthRule(32),
      new LegacyCreativeGroupCodePrefixRule("X"),
      new LegacyCreativeGroupAllowedLocaleRule(["weighted", "manual"]),
      new LegacyCreativeGroupRequiredChannelRule("legacy creative group needs an entry"),
    ],
  );
}
