import * as text from "../../../../kit/text.js";
import { LegacySubscriptionRule } from "./legacy-subscription-rule.js";

/** A rule a legacy subscription rule must pass. Check returns its problems, or none. */
export interface LegacySubscriptionRuleRule {
  check(item: LegacySubscriptionRule): string[];
}

export class LegacySubscriptionRuleAllowedCategoryRule implements LegacySubscriptionRuleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LegacySubscriptionRule): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.category))) return [`category ${item.category} is out of range`];
    return [];
  }
}

export class LegacySubscriptionRulePinnedGuardRule implements LegacySubscriptionRuleRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: LegacySubscriptionRule): string[] {
    if (item.pinned && item.amount > this.limit) return [`amount ${item.amount} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class LegacySubscriptionRuleRequiredVariantRule implements LegacySubscriptionRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacySubscriptionRule): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

export class LegacySubscriptionRuleCategoryLengthRule implements LegacySubscriptionRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacySubscriptionRule): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacySubscriptionRuleVariantLengthRule implements LegacySubscriptionRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacySubscriptionRule): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a legacy subscription rule. */
export class LegacySubscriptionRuleValidator {
  rules: LegacySubscriptionRuleRule[];

  constructor(rules: LegacySubscriptionRuleRule[]) {
    this.rules = rules;
  }

  validate(item: LegacySubscriptionRule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacySubscriptionRule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacySubscriptionRule[]): Map<string, string[]> {
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

export function defaultLegacySubscriptionRuleValidator(): LegacySubscriptionRuleValidator {
  return new LegacySubscriptionRuleValidator(
    [
      new LegacySubscriptionRuleAllowedCategoryRule(["capped"]),
      new LegacySubscriptionRulePinnedGuardRule(3),
      new LegacySubscriptionRuleRequiredVariantRule("legacy subscription rule needs an entry"),
      new LegacySubscriptionRuleCategoryLengthRule(1000),
      new LegacySubscriptionRuleVariantLengthRule(3600),
    ],
  );
}
