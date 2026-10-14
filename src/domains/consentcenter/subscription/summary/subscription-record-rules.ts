import { SubscriptionRecord } from "./subscription-record.js";

/** A rule a subscription record must pass. Check returns its problems, or none. */
export interface SubscriptionRecordRule {
  check(item: SubscriptionRecord): string[];
}

export class SubscriptionRecordMinimumRangeRule implements SubscriptionRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SubscriptionRecord): string[] {
    const value = item.minimum;
    if (value < this.min || value > this.max) return [`minimum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SubscriptionRecordSendAtRangeRule implements SubscriptionRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SubscriptionRecord): string[] {
    const value = item.sendAt;
    if (value < this.min || value > this.max) return [`send at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SubscriptionRecordBudgetRangeRule implements SubscriptionRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SubscriptionRecord): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SubscriptionRecordRequiredLabelRule implements SubscriptionRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SubscriptionRecord): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class SubscriptionRecordRequiredDescriptionRule implements SubscriptionRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SubscriptionRecord): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

export class SubscriptionRecordAttemptsRangeRule implements SubscriptionRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SubscriptionRecord): string[] {
    const value = item.attempts;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`attempts ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`attempts ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a subscription record. */
export class SubscriptionRecordValidator {
  rules: SubscriptionRecordRule[];

  constructor(rules: SubscriptionRecordRule[]) {
    this.rules = rules;
  }

  validate(item: SubscriptionRecord): string[] {
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

  requireValid(item: SubscriptionRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SubscriptionRecord[]): Map<string, string[]> {
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

export function defaultSubscriptionRecordValidator(): SubscriptionRecordValidator {
  return new SubscriptionRecordValidator(
    [
      new SubscriptionRecordMinimumRangeRule(6, 3608.2),
      new SubscriptionRecordSendAtRangeRule(16, 64),
      new SubscriptionRecordBudgetRangeRule(0.6, 3776.5),
      new SubscriptionRecordRequiredLabelRule("subscription record needs this field"),
      new SubscriptionRecordRequiredDescriptionRule("subscription record needs this field"),
      new SubscriptionRecordAttemptsRangeRule(32, 3600),
    ],
  );
}
