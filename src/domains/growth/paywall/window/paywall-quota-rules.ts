import { PaywallQuota } from "./paywall-quota.js";

/** A rule a paywall quota must pass. Check returns its problems, or none. */
export interface PaywallQuotaRule {
  check(item: PaywallQuota): string[];
}

export class PaywallQuotaRequiredTitleRule implements PaywallQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PaywallQuota): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class PaywallQuotaChannelLengthRule implements PaywallQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PaywallQuota): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PaywallQuotaPriorityRangeRule implements PaywallQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PaywallQuota): string[] {
    const value = item.priority;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`priority ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`priority ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a paywall quota. */
export class PaywallQuotaValidator {
  rules: PaywallQuotaRule[];

  constructor(rules: PaywallQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: PaywallQuota): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PaywallQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PaywallQuota[]): Map<string, string[]> {
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

export function defaultPaywallQuotaValidator(): PaywallQuotaValidator {
  return new PaywallQuotaValidator(
    [
      new PaywallQuotaRequiredTitleRule("paywall quota needs a value"),
      new PaywallQuotaChannelLengthRule(80),
      new PaywallQuotaPriorityRangeRule(80, 3600),
    ],
  );
}
