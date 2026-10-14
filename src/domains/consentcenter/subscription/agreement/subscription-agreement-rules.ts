import { SubscriptionAgreement } from "./subscription-agreement.js";

/** A rule a subscription agreement must pass. Check returns its problems, or none. */
export interface SubscriptionAgreementRule {
  check(item: SubscriptionAgreement): string[];
}

export class SubscriptionAgreementAmountRangeRule implements SubscriptionAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SubscriptionAgreement): string[] {
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

export class SubscriptionAgreementActiveGuardRule implements SubscriptionAgreementRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: SubscriptionAgreement): string[] {
    if (item.active && item.impressions > this.limit) return [`impressions ${item.impressions} exceeds ${this.limit} while active`];
    return [];
  }
}

export class SubscriptionAgreementRequiredTitleRule implements SubscriptionAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SubscriptionAgreement): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class SubscriptionAgreementImpressionsRangeRule implements SubscriptionAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SubscriptionAgreement): string[] {
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

export class SubscriptionAgreementRequiredRegionRule implements SubscriptionAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SubscriptionAgreement): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a subscription agreement. */
export class SubscriptionAgreementValidator {
  rules: SubscriptionAgreementRule[];

  constructor(rules: SubscriptionAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: SubscriptionAgreement): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SubscriptionAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SubscriptionAgreement[]): Map<string, string[]> {
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

export function defaultSubscriptionAgreementValidator(): SubscriptionAgreementValidator {
  return new SubscriptionAgreementValidator(
    [
      new SubscriptionAgreementAmountRangeRule(1, 426.5),
      new SubscriptionAgreementActiveGuardRule(64),
      new SubscriptionAgreementRequiredTitleRule("subscription agreement needs this field"),
      new SubscriptionAgreementImpressionsRangeRule(120, 255),
      new SubscriptionAgreementRequiredRegionRule("subscription agreement needs a value"),
    ],
  );
}
