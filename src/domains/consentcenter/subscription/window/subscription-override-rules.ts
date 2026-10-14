import { SubscriptionOverride } from "./subscription-override.js";

/** A rule a subscription override must pass. Check returns its problems, or none. */
export interface SubscriptionOverrideRule {
  check(item: SubscriptionOverride): string[];
}

export class SubscriptionOverrideRequiredNameRule implements SubscriptionOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SubscriptionOverride): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class SubscriptionOverrideRequiredJourneyIdRule implements SubscriptionOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SubscriptionOverride): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

export class SubscriptionOverrideJourneyIdLengthRule implements SubscriptionOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SubscriptionOverride): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SubscriptionOverrideMarginRangeRule implements SubscriptionOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SubscriptionOverride): string[] {
    const value = item.margin;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`margin ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`margin ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SubscriptionOverrideBudgetRangeRule implements SubscriptionOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SubscriptionOverride): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a subscription override. */
export class SubscriptionOverrideValidator {
  rules: SubscriptionOverrideRule[];

  constructor(rules: SubscriptionOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: SubscriptionOverride): string[] {
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

  requireValid(item: SubscriptionOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SubscriptionOverride[]): Map<string, string[]> {
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

export function defaultSubscriptionOverrideValidator(): SubscriptionOverrideValidator {
  return new SubscriptionOverrideValidator(
    [
      new SubscriptionOverrideRequiredNameRule("subscription override needs an entry"),
      new SubscriptionOverrideRequiredJourneyIdRule("subscription override needs this field"),
      new SubscriptionOverrideJourneyIdLengthRule(120),
      new SubscriptionOverrideMarginRangeRule(0.4, 2390.1),
      new SubscriptionOverrideBudgetRangeRule(8.7, 2719.2),
    ],
  );
}
