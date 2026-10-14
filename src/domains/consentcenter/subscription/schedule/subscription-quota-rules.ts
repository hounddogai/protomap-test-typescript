import { SubscriptionQuota } from "./subscription-quota.js";

/** A rule a subscription quota must pass. Check returns its problems, or none. */
export interface SubscriptionQuotaRule {
  check(item: SubscriptionQuota): string[];
}

export class SubscriptionQuotaRequiredCodeRule implements SubscriptionQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SubscriptionQuota): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class SubscriptionQuotaRequiredOwnerIdRule implements SubscriptionQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SubscriptionQuota): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class SubscriptionQuotaCodeLengthRule implements SubscriptionQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SubscriptionQuota): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a subscription quota. */
export class SubscriptionQuotaValidator {
  rules: SubscriptionQuotaRule[];

  constructor(rules: SubscriptionQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: SubscriptionQuota): string[] {
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

  requireValid(item: SubscriptionQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SubscriptionQuota[]): Map<string, string[]> {
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

export function defaultSubscriptionQuotaValidator(): SubscriptionQuotaValidator {
  return new SubscriptionQuotaValidator(
    [
      new SubscriptionQuotaRequiredCodeRule("subscription quota needs an entry"),
      new SubscriptionQuotaRequiredOwnerIdRule("subscription quota needs a value"),
      new SubscriptionQuotaCodeLengthRule(120),
    ],
  );
}
