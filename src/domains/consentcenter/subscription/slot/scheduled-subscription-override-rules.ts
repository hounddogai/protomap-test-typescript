import { ScheduledSubscriptionOverride } from "./scheduled-subscription-override.js";

/** A rule a scheduled subscription override must pass. Check returns its problems, or none. */
export interface ScheduledSubscriptionOverrideRule {
  check(item: ScheduledSubscriptionOverride): string[];
}

export class ScheduledSubscriptionOverrideCodePrefixRule implements ScheduledSubscriptionOverrideRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ScheduledSubscriptionOverride): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ScheduledSubscriptionOverrideAmountRangeRule implements ScheduledSubscriptionOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledSubscriptionOverride): string[] {
    const value = item.amount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`amount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`amount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ScheduledSubscriptionOverrideApprovedGuardRule implements ScheduledSubscriptionOverrideRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: ScheduledSubscriptionOverride): string[] {
    if (item.approved && item.maximum > this.limit) return [`maximum ${item.maximum} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class ScheduledSubscriptionOverrideContactEmailLengthRule implements ScheduledSubscriptionOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledSubscriptionOverride): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledSubscriptionOverrideCodeLengthRule implements ScheduledSubscriptionOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledSubscriptionOverride): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledSubscriptionOverrideRequiredCodeRule implements ScheduledSubscriptionOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledSubscriptionOverride): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a scheduled subscription override. */
export class ScheduledSubscriptionOverrideValidator {
  rules: ScheduledSubscriptionOverrideRule[];

  constructor(rules: ScheduledSubscriptionOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledSubscriptionOverride): string[] {
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

  requireValid(item: ScheduledSubscriptionOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledSubscriptionOverride[]): Map<string, string[]> {
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

export function defaultScheduledSubscriptionOverrideValidator(): ScheduledSubscriptionOverrideValidator {
  return new ScheduledSubscriptionOverrideValidator(
    [
      new ScheduledSubscriptionOverrideCodePrefixRule("REF"),
      new ScheduledSubscriptionOverrideAmountRangeRule(2.1, 3958.8),
      new ScheduledSubscriptionOverrideApprovedGuardRule(2.6),
      new ScheduledSubscriptionOverrideContactEmailLengthRule(64),
      new ScheduledSubscriptionOverrideCodeLengthRule(64),
      new ScheduledSubscriptionOverrideRequiredCodeRule("scheduled subscription override needs a value"),
    ],
  );
}
