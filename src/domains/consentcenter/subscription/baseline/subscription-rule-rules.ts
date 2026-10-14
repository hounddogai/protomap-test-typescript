import { SubscriptionRule } from "./subscription-rule.js";

/** A rule a subscription rule must pass. Check returns its problems, or none. */
export interface SubscriptionRuleRule {
  check(item: SubscriptionRule): string[];
}

export class SubscriptionRuleQuantityRangeRule implements SubscriptionRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SubscriptionRule): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SubscriptionRuleCodePrefixRule implements SubscriptionRuleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SubscriptionRule): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SubscriptionRuleStartsAtRangeRule implements SubscriptionRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SubscriptionRule): string[] {
    const value = item.startsAt;
    if (value < this.min || value > this.max) return [`starts at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SubscriptionRulePriorityRangeRule implements SubscriptionRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SubscriptionRule): string[] {
    const value = item.priority;
    if (value < this.min || value > this.max) return [`priority ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a subscription rule. */
export class SubscriptionRuleValidator {
  rules: SubscriptionRuleRule[];

  constructor(rules: SubscriptionRuleRule[]) {
    this.rules = rules;
  }

  validate(item: SubscriptionRule): string[] {
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

  requireValid(item: SubscriptionRule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SubscriptionRule[]): Map<string, string[]> {
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

export function defaultSubscriptionRuleValidator(): SubscriptionRuleValidator {
  return new SubscriptionRuleValidator(
    [
      new SubscriptionRuleQuantityRangeRule(64, 1000),
      new SubscriptionRuleCodePrefixRule("ACM"),
      new SubscriptionRuleStartsAtRangeRule(120, 120),
      new SubscriptionRulePriorityRangeRule(3600, 86400),
    ],
  );
}
