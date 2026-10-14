import { LegacySubscriptionWindow } from "./legacy-subscription-window.js";

/** A rule a legacy subscription window must pass. Check returns its problems, or none. */
export interface LegacySubscriptionWindowRule {
  check(item: LegacySubscriptionWindow): string[];
}

export class LegacySubscriptionWindowImpressionsRangeRule implements LegacySubscriptionWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacySubscriptionWindow): string[] {
    const value = item.impressions;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`impressions ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`impressions ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LegacySubscriptionWindowArchivedGuardRule implements LegacySubscriptionWindowRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: LegacySubscriptionWindow): string[] {
    if (item.archived && item.budget > this.limit) return [`budget ${item.budget} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class LegacySubscriptionWindowCurrencyLengthRule implements LegacySubscriptionWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacySubscriptionWindow): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacySubscriptionWindowRequiredCodeRule implements LegacySubscriptionWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacySubscriptionWindow): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a legacy subscription window. */
export class LegacySubscriptionWindowValidator {
  rules: LegacySubscriptionWindowRule[];

  constructor(rules: LegacySubscriptionWindowRule[]) {
    this.rules = rules;
  }

  validate(item: LegacySubscriptionWindow): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacySubscriptionWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacySubscriptionWindow[]): Map<string, string[]> {
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

export function defaultLegacySubscriptionWindowValidator(): LegacySubscriptionWindowValidator {
  return new LegacySubscriptionWindowValidator(
    [
      new LegacySubscriptionWindowImpressionsRangeRule(64, 120),
      new LegacySubscriptionWindowArchivedGuardRule(6.9),
      new LegacySubscriptionWindowCurrencyLengthRule(3600),
      new LegacySubscriptionWindowRequiredCodeRule("legacy subscription window needs this field"),
    ],
  );
}
